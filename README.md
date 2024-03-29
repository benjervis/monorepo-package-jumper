# monorepo-package-jumper

A VSCode extension to allow easy navigation between packages in large monorepos.

From the command palette, use "monorepo-package-jumper: Jump to package..." to select from the list of packages in this monorepo.

By default, "Jump to package" is bound to hyper J (cmd + ctrl + alt + shift + j).

## Optimisations

### Selective loading

Some projects are structured as several monorepos inside on repository.
To avoid loading all packages in the whole repo, the extension will only load packages that are part of the same monorepo as the currently open file.
If no files are open, it will load all packages in the whole project.

### Caching

Once the extension has loaded the list of packages for the first time, it caches the results for faster loading next time, as the package contents don't often change.

If they have changed, and you need to refresh the cache, you can use the "monorepo-package-jumper: Reset cache" command from the command palette.
