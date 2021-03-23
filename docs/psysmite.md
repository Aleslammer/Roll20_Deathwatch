# This is for processing the Psychic attack Smite.

This is intended to be used as a extra ability attached to the character sheet under the Abilities section on the "Attributes & Abilities" tab.  You can add the following macro and then select the "Show as Token Action".   So when the player selects the token it will show up as a button.

!Psy_Smite --characterName|@{character_name} --powerLevel|?{Power Level|Fettered|Unfettered|Push} --range|?{Range|Point Blank,+20|Short,+10|Medium,+0|Long,-10|Extreme,-20} --aim|?{Aim|No,+0|Half,+10|Full,+20} --calledShot|?{Called Shot|No,+0|Yes,-20} --runningTarget|?{Running Target|No,+0|Yes,-20} --miscModifier|?{Modifier|0} --characterID|@{character_id} --targetID|@{target|Smite Target|token_id} --tokenID|@{selected|token_id}