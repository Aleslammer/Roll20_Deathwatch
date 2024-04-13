on("ready", function () {
    var version = '2.2.1';
    log("-=> DW_MeleeAttack v" + version + " Loaded ");
});
on("chat:message", function (msg) {
    if (msg.type == "api" && msg.content.indexOf("!DW_MeleeAttack") == 0) {
        const showLog = false;

        var params = {}

        function logMessage(message, override = false) {
            if (showLog || override) {
                log(message)
            }
        }

        function parseArgs(args) {
            for (lcv = 1; lcv < args.length; lcv++) {
                var splitValue = args[lcv].trim().split("|");
                var key = splitValue[0];
                var value = splitValue[1];
                params[key] = value;
            }
        }

        function validateIntArgs() {
            params.aim = parseInt(params.aim);
            params.charge = parseInt(params.charge);
            params.allOut = parseInt(params.allOut);
            params.calledShot = parseInt(params.calledShot);
            params.runningTarget = parseInt(params.runningTarget);
            params.miscModifier = parseInt(params.miscModifier);
            params.powerLevel = parseInt(params.powerLevel);
        }

        function findWeaponID() {
            var myRow = findObjs({ type: 'attribute', characterid: params.characterID }).filter(x => x.get("name").includes("mw_row_id") && x.get("current") == params.weaponID)[0];
            if (myRow) {
                var myRowID = myRow.get("name").replace("repeating_meleeweapons_", "");
                myRowID = myRowID.replace("_mw_row_id", "");
                params.weaponRowID = myRowID;
            }
            else {
                logMessage("Cannot find weapon for " + params.characterName + " and row id " + params.weaponID, true);
            }
        }

        function getWeaponValue(name, defaultValue) {
            var attrName = "repeating_meleeweapons_" + params.weaponRowID + "_" + name;
            var myRow = findObjs({ type: 'attribute', characterid: params.characterID, name: attrName })[0]
            if (myRow) {
                return myRow.get("current");
            }
            else {
                logMessage("Missing Row for " + attrName + " Using default of " + defaultValue);
                return defaultValue;
            }
        }

        function readCharacterSheet() {
            params["magBonus"] = 0;
            params["weaponSkill"] = parseInt(getAttrByName(params.characterID, "WeaponSkill"));
            params["weaponSkillAdv"] = parseInt(getAttrByName(params.characterID, "advanceWS"));

            params["strength"] = parseInt(getAttrByName(params.characterID, "Strength"));

            params["weaponName"] = getWeaponValue("meleeweaponname", "Unknown");
            params["weaponSpecial"] = getWeaponValue("meleeweaponspecial", "");
            params["penetration"] = parseInt(getWeaponValue("meleeweaponpen", 0));
            params["damageType"] = getWeaponValue("meleeweapontype", "Melee");
            params["damageRoll"] = getWeaponValue("meleeweapondamage", "0d0");

            params["unnaturalStrBonus"] = getAttrByName(params.characterID, "unnatural-Strength");
            params["paStrBonus"] = parseInt(getWeaponValue("powerarmourSB", 2));
            params["useSB"] = parseInt(getWeaponValue("useSB", 1));
            params["strengthBonus"] = ((Math.floor(params.strength / 10) * params.unnaturalStrBonus) + params.paStrBonus) * params.useSB;
            params["charType"] = "NPC";
            var player_obj = getObj("player", msg.playerid);
            params["bgColor"] = player_obj.get("color");

            getWeaponQualityBasic("razor_sharp", params);
            getWeaponQualityBasic("toxic", params);
            getWeaponQualityInteger("felling", params);

            var value = findObjs({ type: 'attribute', characterid: params.characterID, name: "charType" })[0];
            if (value) {
                params["charType"] = value.get('current').toUpperCase();
            }

            if (params.powerLevel > 0) {
                params["psyRating"] = parseInt(getAttrByName(params.characterID, "PsyRating"));
                if (params.powerLevel == 1) {
                    // if fetter use half the power
                    params.psyRating = Math.round(params.psyRating / 2);
                }
                else if (params.powerLevel == 3) {
                    // if push use plus the level
                    params.psyRating = params.psyRating + params.powerLevel;
                }

                params["damageRoll"] = params.damageRoll + " + " + params.psyRating;
                params["penetration"] = params.penetration + params.psyRating;
                params["willpower"] = parseInt(getAttrByName(params.characterID, "Willpower"));
                params["willpowerAdv"] = parseInt(getAttrByName(params.characterID, "advanceWP"));
            }

            var token = findObjs({ type: 'graphic', _id: params.targetID })[0];
            params["targetName"] = "Something";
            if (token) {
                params["targetName"] = token.get("name");
                var value = findObjs({ type: 'attribute', characterid: params.targetCharID, name: "charType" })[0];
                if (value) {
                    params["tarType"] = value.get('current').toUpperCase();
                    if (params.tarType == "HORDE") {
                        params["tarMag"] = parseInt(token.get("bar1_max")) - parseInt(token.get("bar1_value"));
                        if (params.tarMag >= 120) {
                            params.magBonus = 60;
                        }
                        else if (params.tarMag >= 90) {
                            params.magBonus = 50;
                        }
                        else if (params.tarMag >= 60) {
                            params.magBonus = 40;
                        }
                        else if (params.tarMag >= 30) {
                            params.magBonus = 30;
                        }
                    }
                }
            }

            if (params.powerLevel > 0) {
                params["tarWillpower"] = parseInt(getAttrByName(params.targetCharID, "Willpower"));
                params["tarWillpowerAdv"] = parseInt(getAttrByName(params.targetCharID, "advanceWP"));
            }

            params.rfNonPCMod = 10000;
            if (params["charType"] == "PLAYER") {
                params.rfNonPCMod = 0;
            }

        }

        function findHordeDamageBonus() {
            logMessage("Finding Horde Damage Bonus " + params.selectedTokenID);
            var token = findObjs({ type: 'graphic', _id: params.selectedTokenID })[0];
            if (token) {
                var charMag = parseInt(token.get("bar1_max")) - parseInt(token.get("bar1_value"));
                var bonusDice = Math.trunc(charMag / 10)
                if (bonusDice > 2) {
                    bonusDice = 2
                }
                params["hordeBonus"] = bonusDice + "d10";
                params.damageRoll = params.damageRoll + " + " + params.hordeBonus;

                logMessage("Horde Damage Bonus = " + params.damageRoll)
            }
        }

        function buildDamageButton(sendChatMessage) {
            sendChatMessage += `\n--?[$HitConfirm] -gt 0|[`;
            sendChatMessage += `\n  --+|[sheetbutton]Attempt Parry?::${params.targetID}::WS[/sheetbutton] [sheetbutton]Attempt Dodge?::${params.targetID}::dodge[/sheetbutton]`;
            sendChatMessage += `\n  --+|[rbutton]Apply Damage!::EXEC_DAMAGE[/rbutton] [rbutton]Attack Parried::EXEC_PARRIED[/rbutton] [rbutton]Attack Dodged::EXEC_DODGED[/rbutton]`;
            sendChatMessage += `\n--]|`

            sendChatMessage += `\n--X|`;
            sendChatMessage += `\n--:EXEC_DAMAGE|`;
            sendChatMessage += `\n  --#title | ${params.characterName} damages ${params.targetName}`;
            sendChatMessage += `\n  --?[$RFConfirm.Total] -ge 0|[`;
            sendChatMessage += `\n     --+Righteous Fury:|Confirmed`;
            sendChatMessage += `\n     --&DamageRoll|${params.damageRoll}`;
            sendChatMessage += `\n  --]|[`;
            sendChatMessage += `\n     --&DamageRoll|${params.damageRoll}`;
            sendChatMessage += `\n     --&DamageRoll|[&DamageRoll(replace,!,)]`;
            sendChatMessage += `\n  --]|`;

            sendChatMessage += `\n  --?[$hitDos] -gt 1 -and true -eq ${params.razor_sharp}|[`;
            sendChatMessage += `\n     --=Penetration|2 * ${params.penetration}`;
            sendChatMessage += `\n  --]|[`;
            sendChatMessage += `\n     --=Penetration|${params.penetration}`;
            sendChatMessage += `\n  --]|`;

            sendChatMessage += `\n  --+Damage Type:|${params.damageType}`;
            sendChatMessage += `\n  --+Penetration:|[$Penetration]`;
            sendChatMessage += `\n  --vtoken|${params.targetID} BloodSplat`;

            sendChatMessage = addForceDamage(sendChatMessage)
            sendChatMessage = addHitLocation(sendChatMessage)

            sendChatMessage += `\n  --?[$ForceDamage.Total] -gt 0|[`
            sendChatMessage += `\n    --@DW_ApplyWounds|_targetCharID|${params.targetCharID} _tarTokenID|${params.targetID} _pen|[$Penetration] _hits|[&hitLocation]-[$meleeDamage] _alterBar|1 _forceDam|[$ForceDamage] _hordeHits|[$HordeHits] _felling|${params.felling} _toxic|${params.toxic}`;
            sendChatMessage += `\n  --]|[`
            sendChatMessage += `\n    --@DW_ApplyWounds|_targetCharID|${params.targetCharID} _tarTokenID|${params.targetID} _pen|[$Penetration] _hits|[&hitLocation]-[$meleeDamage] _alterBar|1 _hordeHits|[$HordeHits] _felling|${params.felling} _toxic|${params.toxic}`;
            sendChatMessage += `\n--]|`
            sendChatMessage += `\n--X|`;
            sendChatMessage += `\n--:EXEC_DODGED|`;
            sendChatMessage += `\n--#title |  ${params.targetName} dodges attack from ${params.characterName}`;
            sendChatMessage += `\n--X|`;
            sendChatMessage += `\n--:EXEC_PARRIED|`;
            sendChatMessage += `\n--#title |  ${params.targetName} parries the attack from ${params.characterName}`;
            sendChatMessage += `\n--X|`;
            return sendChatMessage;
        }

        function addForceDamage(sendChatMessage) {
            if (params.powerLevel > 0) {
                if (params.psyRating != "NaN") {
                    // we have a force weapon and need to calculate extra damage.

                    // Will roll for character
                    sendChatMessage += `\n  --=WillRoll|1d100`;
                    sendChatMessage += `\n  --=WillRollTotal|[Will] ${params.willpower} + [Adv] ${params.willpowerAdv} + [Force] ${(5 * params.psyRating)} - [Roll][$WillRoll]`;

                    // Will roll for target
                    sendChatMessage += `\n  --=TarWillRoll|1d100`;
                    sendChatMessage += `\n  --=TarWillRollTotal|[Will] ${params.tarWillpower} + [Adv] ${params.tarWillpowerAdv} - [Roll][$TarWillRoll]`;

                    // Calculate Degrees of success
                    sendChatMessage += `\n  --=Willdos|[$WillRollTotal] / 10 {FLOOR}`;
                    sendChatMessage += `\n  --?[$Willdos] -eq 0|[`;
                    sendChatMessage += `\n     --=Willdos| [$Willdos] + 1`;
                    sendChatMessage += `\n  --]|`;
                    sendChatMessage += `\n  --=PerilTest|[$WillRoll] % 11`;

                    // Calculate if force damage will be applied
                    sendChatMessage += `\n  --+${params.characterName} Will Test|[$WillRollTotal]`;
                    sendChatMessage += `\n  --+${params.targetName} Will Test|[$TarWillRollTotal]`;
                    sendChatMessage += `\n  --?[$WillRollTotal.Total] -ge 0 -and [$WillRollTotal] -gt [$TarWilLRollTotal]|[`;
                    sendChatMessage += `\n     --=ForceDamage|[$Willdos]d10`;
                    sendChatMessage += `\n     --+Force Damage| [$ForceDamage]`;
                    sendChatMessage += `\n  --]|`;

                    // Check for Unfettered Peril
                    sendChatMessage += `\n  --?[$PerilTest] -eq 0 -and ${params.powerLevel} -eq 2|[`;
                    sendChatMessage += `\n    --=PsychicPheno|1d100`;
                    sendChatMessage += `\n    --+|[img](https://media.giphy.com/media/L4TNHVeOP0WrWyXT5m/giphy.gif)`;
                    sendChatMessage += `\n    --+PERIL OF THE WARP!:|Will Roll - [$WillRoll] Psychic Phenomena - [$PsychicPheno]`;
                    sendChatMessage += `\n  --]|`;

                    // Check for Push Peril
                    sendChatMessage += `\n  --?${params.powerLevel} -eq 3|[`;
                    sendChatMessage += `\n    --=PsychicPheno|1d100`;
                    sendChatMessage += `\n    --+|[img](https://media.giphy.com/media/L4TNHVeOP0WrWyXT5m/giphy.gif)`;
                    sendChatMessage += `\n    --+PERIL OF THE WARP!:|Psychic Phenomena - [$PsychicPheno]`;
                    sendChatMessage += `\n  --]|`;
                }
            }

            return sendChatMessage;
        }

        function addHitLocation(sendChatMessage) {
            // Flip the roll
            sendChatMessage += "\n--=rollSingle|[$HitRoll] % 10";
            sendChatMessage += "\n--=rollTens|[$HitRoll] - [$rollSingle]";
            sendChatMessage += "\n--=rollTens|[$rollTens] / 10";
            sendChatMessage += "\n--=rollSingle|[$rollSingle] * 10";
            sendChatMessage += "\n--=reverse|[$rollTens] + [$rollSingle]";

            //Determine Location
            sendChatMessage += "\n--?[$reverse] -gt 0 -and [$reverse] -lt 11|[";
            sendChatMessage += "\n  --&hitLocation|Head";
            sendChatMessage += "\n--]|";
            sendChatMessage += "\n--?[$reverse] -gt 10 -and [$reverse] -lt 21|[";
            sendChatMessage += "\n  --&hitLocation|Right Arm";
            sendChatMessage += "\n--]|";
            sendChatMessage += "\n--?[$reverse] -gt 20 -and [$reverse] -lt 31|[";
            sendChatMessage += "\n  --&hitLocation|Left Arm";
            sendChatMessage += "\n--]|";
            sendChatMessage += "\n--?[$reverse] -gt 30 -and [$reverse] -lt 71|[";
            sendChatMessage += "\n  --&hitLocation|Body";
            sendChatMessage += "\n--]|";
            sendChatMessage += "\n--?[$reverse] -gt 70 -and [$reverse] -lt 86|[";
            sendChatMessage += "\n  --&hitLocation|Right Leg";
            sendChatMessage += "\n--]|";
            sendChatMessage += "\n--?[$reverse] -gt 85 -and [$reverse] -lt 101|[";
            sendChatMessage += "\n  --&hitLocation|Left Leg";
            sendChatMessage += "\n--]|";

            // Determine Damage
            sendChatMessage += `\n--=meleeDamage|[&DamageRoll] + ${params.strengthBonus}`;
            sendChatMessage += "\n--+Hit:|[&hitLocation] for [$meleeDamage]";
            return sendChatMessage;
        }

        function getWeaponQualityBasic(qualityName, params) {
            params[qualityName] = false
            if (params.weaponSpecial.includes(qualityName)) {
                logMessage("Found " + qualityName)
                params[qualityName] = true
            }
        }

        function getWeaponQualityInteger(qualityName, params) {
            params[qualityName] = 0;
            pattern = qualityName + '\\s*\\(\\d+\\)';
            value = params.weaponSpecial.match(pattern);
            if (value != null && value.length > 0) {
                params[qualityName] = parseInt(value[0].match(/\d+/))
                logMessage(qualityName + " has value " + params[qualityName])
            }
        }

        args = msg.content.split("--");

        // parse all the arguments
        parseArgs(args);

        // Validate the integer arguments
        validateIntArgs();

        // find the weapon id for the weapon provided
        findWeaponID();

        // read values off the character sheet
        readCharacterSheet();

        if (params.charType == "HORDE") {
            // character is a horde find out any bonus to damage
            findHordeDamageBonus();
        }

        // output parameters to the log
        logMessage(params);

        var sendChatMessage = "";
        const scriptCardStart = "!script {{";
        const scriptCardStop = "\n}}";

        sendChatMessage += scriptCardStart;
        sendChatMessage += `\n--#title|${params.characterName} is attacking ${params.targetName}!`;
        sendChatMessage += `\n--#titleCardBackground|${params.bgColor}`;
        sendChatMessage += `\n--#subtitleFontSize|10px`;
        sendChatMessage += `\n--#subtitleFontColor|#000000`;
        sendChatMessage += `\n--#leftsub|${params.weaponName}`;
        sendChatMessage += `\n--#rightsub|${params.weaponSpecial}`;
        sendChatMessage += `\n--+|[img](https://media.giphy.com/media/8m5dcYxrBAuGK0g2hJ/giphy.gif)`;
        sendChatMessage += `\n--=HitRoll|1d100`;
        sendChatMessage += `\n--=RFRoll|1d100`;
        sendChatMessage += `\n--=HitConfirm|[WS]${params.weaponSkill} + [WSadv]${params.weaponSkillAdv} + [Aim]${params.aim} + [AllOut]${params.allOut} + [Called]${params.calledShot} + [Charge]${params.charge} + [Running]${params.runningTarget} + [Misc]${params.miscModifier} + [HordeMag]${params.magBonus} - [Roll][$HitRoll]`;
        sendChatMessage += `\n--=RFConfirm|[WS]${params.weaponSkill} + [WSadv]${params.weaponSkillAdv} + [Aim]${params.aim} + [AllOut]${params.allOut} + [Called]${params.calledShot} + [Charge]${params.charge} + [Running]${params.runningTarget} + [Misc]${params.miscModifier} + [HordeMag]${params.magBonus} - [Roll][$RFRoll] - ${params.rfNonPCMod}`;
        sendChatMessage += `\n--?[$HitConfirm.Total] -ge 0|[`
        sendChatMessage += `\n  --=hitDos|[$HitConfirm] / 10`;
        sendChatMessage += `\n  --=HordeHits|[$hitDos] / 2 {Floor} + 1`
        sendChatMessage += `\n--]|[`
        sendChatMessage += `\n  --=HordeHits|0`
        sendChatMessage += `\n--]|`

        params.aim != 0 ? sendChatMessage += `\n--+Aim Modifier:|${params.aim}` : null;
        params.allOut != 0 ? sendChatMessage += `\n--+All Out Modifier:|${params.allOut}` : null;
        params.calledShot != 0 ? sendChatMessage += `\n--+Called Shot Modifier:|${params.calledShot}` : null;
        params.charge != 0 ? sendChatMessage += `\n--+Charge Modifier:|${params.charge}` : null;
        params.runningTarget != 0 ? sendChatMessage += `\n--+Running Target Modifier:|${params.runningTarget}` : null;
        params.miscModifier != 0 ? sendChatMessage += `\n--+Misc Modifier:|${params.miscModifier}` : null;
        params.magBonus != 0 ? sendChatMessage += `\n--+Horde Size Modifier:|${params.magBonus}` : null;
        sendChatMessage += `\n--+Attack Roll:|[$HitConfirm]`;

        sendChatMessage = buildDamageButton(sendChatMessage);

        sendChatMessage += scriptCardStop;
        logMessage(sendChatMessage);
        sendChat("From", sendChatMessage);
    }
});