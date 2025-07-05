#!/bin/bash

if [ $# -lt 1 ]; then
    echo "Usage: ./release (game)"
    exit 1
fi

if [ "$1" == "game" ]; then
  # Run build process before release
  echo "Running build process..."
  if ! tsc -b && vite build; then
    echo "Build failed. Aborting release."
    exit 1
  fi
  echo "Build completed successfully."

  # Get the latest semantic version tag
  latest_tag=$(git tag -l 'v*' --sort=-v:refname | head -n 1)

  if [ -z "$latest_tag" ]; then
      echo "No existing tag found with the format 'vX.X.X'"
      exit 1
  fi

  # Break down the version numbers
  major=$(echo "$latest_tag" | cut -d "." -f 1 | sed 's/v//')
  minor=$(echo "$latest_tag" | cut -d "." -f 2)
  patch=$(echo "$latest_tag" | cut -d "." -f 3)

  # Increment the version based on the argument
  if [ "$2" == "minor" ]; then
      new_minor=$((minor + 1))
      new_patch=0 # reset patch version
      new_tag="v$major.$new_minor.$new_patch"
  else
    if [ "$2" == "" ] || [ "$2" = "patch" ]; then
      new_patch=$((patch + 1))
      new_tag="v$major.$minor.$new_patch"
    else
      echo "Usage ./release game [minor|patch]"
      exit 1
    fi
  fi
fi

# Create the new tag on the current HEAD
git tag $new_tag

# Push the new tag to the remote repository
git push origin $new_tag