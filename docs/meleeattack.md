# DW_MeleeAttack

[Script](../scripts/DW_MeleeAttack.js)

This is called from the modified character sheet passing values based on the weapon selected.

## Requirements

    - PowerCards
    - DW_ApplyWounds

## Input

This script is intended to be called from the character sheet.

* **Target** - The target of your melee attack.
* **All Out** - This indicates if the attack is using the all out ability.   Values are Yes or No.
* **Charging** - Indicates if the attacker is charging his opponent.   Values are Yes or No.
* **Aim** - The Aim value for this attack.   Values are
  * None - Represents no aiming is done.
  * Half - Represents a half action aim.
  * Full - Represents a full previous action as aim.
* **Called Shot** - Indicates if the attacker is calling their shot.  Values are Yes or No.
* **Running** - Indicates if the target is running or not.  Values are Yes or No.
* **Modifier** - Used for any miscellaneous modifier not already used above.
* **PowerLevel** - The power level to use when attack intends to imbue the weapon with psychic energy.  If the user does not have a psyRating this has no effect.

## Macro

You can setup a token macro as well.   So that when the user selects their token a button for attack will appear.  This can be done on the "Attributes & Abilities" tab of the character sheet page.   You need to set-up a separate one for each melee weapon.  The key is to change the **weaponID** value to the row ID of the melee weapon you wish to setup a macro for.

```
!DW_MeleeAttack --characterName|@{character_name} --allOut|?{All Out|No,0|Yes,+20}  --charge|?{Charge|No,0|Yes,+10} --aim|?{Aim|No,+0|Half,+10|Full,+20} --calledShot|?{Called Shot|No,+0|Yes,-20} --runningTarget|?{Running|No,+0|Yes,20} --miscModifier|?{Modifier|0} --characterID|@{character_id} --weaponID|1 --targetID|@{target|token_id} --targetCharID|@{target|character_id} --powerLevel|?{PowerLevel|None,0|Fettered,1|Unfettered,2|Push,3}
```

### Standard / Force Attack

![Standard Attack](images/melee.png) ![ForceWeapon Attack](images/melee-force.png)