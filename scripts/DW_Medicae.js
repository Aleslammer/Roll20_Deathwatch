on("ready", function () {
    var version = '0.0.1';
    log("-=> DW_Medicae v" + version + " Loaded ");
});
on("chat:message", function (msg) {
    if (msg.type == "api" && msg.content.indexOf("!DW_Medicae") == 0) {
        const showLog = true;

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

        function readCharacterSheet() {
            var player_obj = getObj("character", params.characterID);
            logMessage(player_obj)

            params["medicaeSkillAdv"] = getAttrByName(params.characterID, "Medicae").replace("@{MedicaeCharacteristic}", "").replace("(", "").replace(")", "").replace("+", "").trim();

            if (params.medicaeSkillAdv == "0") {
                logMessage("Invalid Skill!!!")
            }
            else if (params.medicaeSkillAdv == "") {
                params.medicaeSkillAdv = 0
            }
            else {
                params.medicaeSkillAdv = parseInt(params.medicaeSkillAdv);
            }

            params["int"] = parseInt(getAttrByName(params.characterID, "Intelligence"));
            params["advanceInt"] = parseInt(getAttrByName(params.characterID, "advanceInt"))
            // params["weaponName"] = getWeaponValue("meleeweaponname", "Unknown");
            // params["weaponSpecial"] = getWeaponValue("meleeweaponspecial", "");
            // params["penetration"] = parseInt(getWeaponValue("meleeweaponpen", 0));
            // params["damageType"] = getWeaponValue("meleeweapontype", "Melee");
            // params["damageRoll"] = getWeaponValue("meleeweapondamage", "0d0");

            // params["unnaturalStrBonus"] = getAttrByName(params.characterID, "unnatural-Strength");
            // params["paStrBonus"] = parseInt(getWeaponValue("powerarmourSB", 2));
            // params["useSB"] = parseInt(getWeaponValue("useSB", 1));
            // params["strengthBonus"] = ((Math.floor(params.strength / 10) * params.unnaturalStrBonus) + params.paStrBonus) * params.useSB;
            // params["charType"] = "NPC";
            params["bgColor"] = player_obj.get("color");

            // getWeaponQualityBasic("razor_sharp", params);
            // getWeaponQualityBasic("toxic", params);
            // getWeaponQualityInteger("felling", params);

            // var value = findObjs({ type: 'attribute', characterid: params.characterID, name: "charType" })[0];
            // if (value) {
            //     params["charType"] = value.get('current').toUpperCase();
            // }

            // if (params.powerLevel > 0) {
            //     params["psyRating"] = parseInt(getAttrByName(params.characterID, "PsyRating"));
            //     if (params.powerLevel == 1) {
            //         // if fetter use half the power
            //         params.psyRating = Math.round(params.psyRating / 2);
            //     }
            //     else if (params.powerLevel == 3) {
            //         // if push use plus the level
            //         params.psyRating = params.psyRating + params.powerLevel;
            //     }

            //     params["damageRoll"] = params.damageRoll + " + " + params.psyRating;
            //     params["penetration"] = params.penetration + params.psyRating;
            //     params["willpower"] = parseInt(getAttrByName(params.characterID, "Willpower"));
            //     params["willpowerAdv"] = parseInt(getAttrByName(params.characterID, "advanceWP"));
            // }

            var token = findObjs({ type: 'graphic', _id: params.targetID })[0];
            params["targetName"] = "Something";
            if (token) {
                params["targetName"] = token.get("name");
                //     var value = findObjs({ type: 'attribute', characterid: params.targetCharID, name: "charType" })[0];
                //     if (value) {
                //         params["tarType"] = value.get('current').toUpperCase();
                //         if (params.tarType == "HORDE") {
                //             params["tarMag"] = parseInt(token.get("bar1_max")) - parseInt(token.get("bar1_value"));
                //             if (params.tarMag >= 120) {
                //                 params.magBonus = 60;
                //             }
                //             else if (params.tarMag >= 90) {
                //                 params.magBonus = 50;
                //             }
                //             else if (params.tarMag >= 60) {
                //                 params.magBonus = 40;
                //             }
                //             else if (params.tarMag >= 30) {
                //                 params.magBonus = 30;
                //             }
                //         }
                //     }
            }

            // if (params.powerLevel > 0) {
            //     params["tarWillpower"] = parseInt(getAttrByName(params.targetCharID, "Willpower"));
            //     params["tarWillpowerAdv"] = parseInt(getAttrByName(params.targetCharID, "advanceWP"));
            // }

            // params.rfNonPCMod = 10000;
            // if (params["charType"] == "PLAYER") {
            //     params.rfNonPCMod = 0;
            // }

        }


        args = msg.content.split("--");

        // parse all the arguments
        parseArgs(args);

        // read values off the character sheet
        readCharacterSheet();

        // output parameters to the log
        logMessage(params);

        var sendChatMessage = "";
        const scriptCardStart = "!script {{";
        const scriptCardStop = "\n}}";

        sendChatMessage += scriptCardStart;
        sendChatMessage += `\n--#title|${params.characterName} is healing ${params.targetName}!`;
        sendChatMessage += `\n--#titleCardBackground|${params.bgColor}`;
        sendChatMessage += `\n--#subtitleFontSize|10px`;
        sendChatMessage += `\n--#subtitleFontColor|#000000`;
        //        sendChatMessage += `\n--+|[img](https://media.giphy.com/media/8m5dcYxrBAuGK0g2hJ/giphy.gif)`;
        sendChatMessage += `\n--=CheckRoll|1d100`;

        sendChatMessage += `\n--+Int:|${params.int}`;
        sendChatMessage += `\n--+IntAdv:|${params.advanceInt}`;

        sendChatMessage += `\n--+Med Skill Adv:|${params.medicaeSkillAdv}`;


        // sendChatMessage += `\n--=RFRoll|1d100`;
        // sendChatMessage += `\n--=HitConfirm|[WS]${params.weaponSkill} + [WSadv]${params.weaponSkillAdv} + [Aim]${params.aim} + [AllOut]${params.allOut} + [Called]${params.calledShot} + [Charge]${params.charge} + [Running]${params.runningTarget} + [Misc]${params.miscModifier} + [HordeMag]${params.magBonus} - [Roll][$HitRoll]`;
        // sendChatMessage += `\n--=RFConfirm|[WS]${params.weaponSkill} + [WSadv]${params.weaponSkillAdv} + [Aim]${params.aim} + [AllOut]${params.allOut} + [Called]${params.calledShot} + [Charge]${params.charge} + [Running]${params.runningTarget} + [Misc]${params.miscModifier} + [HordeMag]${params.magBonus} - [Roll][$RFRoll] - ${params.rfNonPCMod}`;
        // sendChatMessage += `\n--?[$HitConfirm.Total] -ge 0|[`
        // sendChatMessage += `\n  --=hitDos|[$HitConfirm] / 10`;
        // sendChatMessage += `\n  --=HordeHits|[$hitDos] / 2 {Floor} + 1`
        // sendChatMessage += `\n--]|[`
        // sendChatMessage += `\n  --=HordeHits|0`
        // sendChatMessage += `\n--]|`

        // params.aim != 0 ? sendChatMessage += `\n--+Aim Modifier:|${params.aim}` : null;
        // params.allOut != 0 ? sendChatMessage += `\n--+All Out Modifier:|${params.allOut}` : null;
        // params.calledShot != 0 ? sendChatMessage += `\n--+Called Shot Modifier:|${params.calledShot}` : null;
        // params.charge != 0 ? sendChatMessage += `\n--+Charge Modifier:|${params.charge}` : null;
        // params.runningTarget != 0 ? sendChatMessage += `\n--+Running Target Modifier:|${params.runningTarget}` : null;
        // params.miscModifier != 0 ? sendChatMessage += `\n--+Misc Modifier:|${params.miscModifier}` : null;
        // params.magBonus != 0 ? sendChatMessage += `\n--+Horde Size Modifier:|${params.magBonus}` : null;
        // sendChatMessage += `\n--+Attack Roll:|[$HitConfirm]`;

        // sendChatMessage = buildDamageButton(sendChatMessage);

        sendChatMessage += scriptCardStop;
        logMessage(sendChatMessage);
        sendChat("From", sendChatMessage);
    }
});