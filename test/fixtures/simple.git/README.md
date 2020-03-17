# Test fixture: simple.git

This is a bare repo for integration tests.

You can clone this repo locally, e.g. from the root of the `ci_tools` project, like this:

    $ pwd
    /Users/rrrene/projects/ci_tools

    $ git clone test/fixtures/simple.git tmp/simple
    Cloning into 'tmp/simple'...
    done.

The cloned directory is now a normal Git working copy

    $ cd tmp/simple

    $ git status
    On branch master
    Your branch is up to date with 'origin/master'.

    nothing to commit, working tree clean

    $ git remote --verbose
    origin	/Users/rrrene/projects/ci_tools/test/fixtures/simple.git (fetch)
    origin	/Users/rrrene/projects/ci_tools/test/fixtures/simple.git (push)
