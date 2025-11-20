# Techniques skill and difficulty syntaxe
On the Technique sheets, you will find two fields `Difficulty` and `Skill`.

These fields have special constraints, you will find theirs rules below.

## Difficulty
Can be :
  - A integer number : `1` to `9`.
  - Or specific syntax "@`S`:`prop1`" or "@`T`:`prop1`|`max`" or "@`T`:`prop1`|`max`(`prop2`)" :
    - `@` fixed, trigger the parser
    - `T` or `S` : `T`arget or `S`elf, define the actor to get the value.
    - `prop1` / `prop2` : Can be any property in `actor` or `actor.system`. Limitations: currently no `size`, `distance` (range) or computation (a+b).
    - `|` separator, optional if no min/max.
    - `min` or `max` : Between the selected targets, search for the min/max of `prop2`. If no `prop2` provided, take `prop1` as `prop2` (irrelevant for `@S`).
    - `(prop2)` : define the property for the actor selection in multiple target, can be omitted if same as `prop1`.
    - Examples :
      - `@S:vigilance` : Difficulty will be my own `vigilance`.
      - `@T:vigilance|min` : Difficulty will be the `vigilance` from the target with the minimum vigilance (implicit) value. it's the same to wrote `@T:vigilance|min(vigilance)`.
      - `@T:vigilance|max(statusRank)` : Difficulty will be the `vigilance` from the target with the maximum `statusRank` value.


## Skill
Can be :
  - Any `Skill` id : `melee`, `fitness`...
  - Any `SkillCategory` id : `scholar`, `martial`...
  - Or both in list, coma separated.
  - Examples :
    - `theology`
    - `melee,ranged,unarmed`
    - `martial,fitness,performance`
