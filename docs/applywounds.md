# DW_ApplyWounds

[Script](../scripts/DW_ApplyWounds.js)

This is a helper script attached to the attack scripts.

## Requirements

    - *optional* AlterBars

## Input

This script is intended to run in conjunction with the other scripts in the environment.  It has the following parameters

1. targetCharID - This the the target character ID that the attack is for.
1. tarTokenID - This is the target token ID for that the attack is for.
1. pen - This is the penetration value of the attacking weapon.
1. hits - This is a list of semi-colon separated Location-Value pairs.
1. alterBar - An *OPTIONAL* value that indicates if the alterbar api script should be used.

## Notes

* An optional character sheet value of *charType* can be set to indicate one of three values.
  1. horde - This value indicates the target is a horde.   And hits are reflected as single points of damage.
  1. player - This value indicates that the target is a player.   When attacked it will direct its output to the player as well as GM.
* You can enable logging of all sorts of API data by changing the value of the log constant.

    ```javascript
    const showLog = false;
    ```

## Output

When this script is triggered it will determine the armor on the target location and determine how many wounds to apply.   If AlterBars is not used it will whisper to the GM and the Player (if the target). The number of wounds suffered.  If AlterBars is used it will use the AlterBars script and send the message to the GM.
