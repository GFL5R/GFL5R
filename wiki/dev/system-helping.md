# System helping (Contribute)
## Rules
You are free to contribute and propose corrections, modifications after fork. Try to respect theses rules:
- Make sure you are up-to-date with the referent branch (most of the time the `dev` branch).
- Clear and precise commit messages allow a quick review of the code.
- If possible, limit yourself to one Feature per Merge request so as not to block the process.


## Dev install
1. Clone the repository.
2. Use `npm ci` to install the dependence.
3. Create a link from `<repo>/system` to your foundry system data (by default `%localappdata%/FoundryVTT/data/systems/l5r5e`).

Windows example (modify the target and source directories, and run this in administrator) :
```bash
mklink /D /J "%localappdata%/FoundryVTT/data/systems/l5r5e" "D:/Projects/FVTT/l5r5e/system"
```


## Compiling SCSS
1. Run `npm run watch` to watch and compile the `scss` files.
