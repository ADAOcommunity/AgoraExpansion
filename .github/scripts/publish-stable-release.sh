#!/usr/bin/env bash
set -euo pipefail

tag='v1.0.0'
repository="${GITHUB_REPOSITORY:?Missing repository}"
target="${GITHUB_SHA:?Missing release commit}"
actor="${GITHUB_ACTOR:?Missing actor}"

if [[ "$repository" != 'ADAOcommunity/AgoraExpansion' || "${GITHUB_REF:-}" != 'refs/heads/main' ]]; then
  echo 'Release publication is restricted to the upstream main branch.' >&2
  exit 1
fi
if [[ "$(git rev-parse HEAD)" != "$target" ]]; then
  echo 'Checkout does not match the triggering release commit.' >&2
  exit 1
fi

# Listing releases distinguishes a missing release from an API/authentication failure.
status="$(gh api "repos/$repository/releases" --paginate --jq '.[] | select(.tag_name == "v1.0.0") | if .draft then "draft" elif .prerelease then "prerelease" else "published" end')"
remote_tag="$(git ls-remote --tags origin "refs/tags/$tag" "refs/tags/$tag^{}")"

if [[ "$status" == 'published' ]]; then
  if [[ -z "$remote_tag" ]]; then
    echo 'The published release has no tag. Restore its original tag before retrying.' >&2
    exit 1
  fi
  echo "$tag is already published; no changes made."
  exit 0
elif [[ -n "$status" ]]; then
  echo 'An existing draft or prerelease needs maintainer review before publication.' >&2
  exit 1
fi

version="$(node -p 'require("./agora-expansion-fe/package.json").version')"
if [[ "$version" != "${tag#v}" ]]; then
  echo 'Frontend version does not match the stable release tag.' >&2
  exit 1
fi

if [[ -n "$remote_tag" ]]; then
  tag_commit="$(printf '%s\n' "$remote_tag" | awk '$2 ~ /\^\{\}$/ { print $1 }')"
  if [[ -z "$tag_commit" ]]; then
    tag_commit="$(printf '%s\n' "$remote_tag" | awk '{ print $1 }')"
  fi
  if [[ "$tag_commit" != "$target" ]]; then
    echo 'The existing tag points to a different commit; it will not be moved.' >&2
    exit 1
  fi
else
  git -c user.name="$actor" -c user.email="$actor@users.noreply.github.com" \
    tag -a "$tag" "$target" -m "AgoraExpansion $tag"
  git push origin "refs/tags/$tag"
fi

gh release create "$tag" --repo "$repository" --verify-tag \
  --title "AgoraExpansion $tag" --notes-file RELEASE_NOTES.md --latest
