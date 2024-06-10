# DW_MeleeAttack

[Script](../scripts/DW_FirstAid.js)

This is called from a token macro on the character.  

## Requirements

    - ScriptCards
    - alterbar

## Input

This script is intended to be called from a macro.

* **Target** - The target of your first aid attempt.

## Notes

The script will perform the Medicae test and will determine how many wounds are healed. There is a homebrew rule attached as well where based on the degrees of success sets the minimum dice value healed. For example the typical 1d5 + int bonus. If you have 2 degrees of success the heal is 1d5 + int with 1 rerolled until higher than 2.  After this depending on how many wounds the character has available to be treated they apply to themselves with the Heal global macro.

## Macro

Token macro for first aid

```
!DW_FirstAid --characterName|@{character_name} --miscModifier|?{Modifier|0} --characterID|@{character_id} --selectedTokenID|@{selected|token_id} --targetID|@{target|HealTarget|token_id} --targetCharID|@{target|HealTarget|character_id}
```

## Heal Global Macro

Once the first aid is rolled and determined the target healed character can then use the global token macro for healing.

```
!alter --target|@{selected|token_id} --bar|1 --amount|-?{Amount|0}
```
