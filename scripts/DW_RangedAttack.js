on("ready", function () {
    var version = '2.1.2';
    log("-=> DW_RangedAttack v" + version + " Loaded ");
});
on("chat:message", function (msg) {
    if (msg.type == "api" && msg.content.indexOf("!DW_RangedAttack") == 0) {
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
            params.range = parseInt(params.range);
            params.aim = parseInt(params.aim);
            params.autoFire = parseInt(params.autoFire);
            params.calledShot = parseInt(params.calledShot);
            params.runningTarget = parseInt(params.runningTarget);
            params.miscModifier = parseInt(params.miscModifier);
        }

        function getSide() {
            var sideArray = ["Right", "Left"];
            return sideArray[Math.floor(Math.random() * sideArray.length)];
        }

        function getHit(roll, hitNumber) {

            var hitArray = [
                ["Head", "Head", getSide() + " Arm", "Body", getSide() + " Arm", "Body"],
                ["Right Arm", getSide() + " Arm", "Body", "Head", "Body", getSide() + " Arm"],
                ["Left Arm", getSide() + " Arm", "Body", "Head", "Body", getSide() + " Arm"],
                ["Body", "Body", getSide() + " Arm", "Head", getSide() + " Arm", "Body"],
                ["Right Leg", getSide() + " Leg", "Body", getSide() + " Arm", "Head", "Body"],
                ["Left Leg", getSide() + " Leg", "Body", getSide() + " Arm", "Head", "Body"]
            ];

            var hitSequence;
            if (roll >= 1 && roll <= 10) {
                hitSequence = hitArray[0];
            }
            else if (roll >= 11 && roll <= 20) {
                hitSequence = hitArray[1];
            }
            else if (roll >= 21 && roll <= 30) {
                hitSequence = hitArray[2];
            }
            else if (roll >= 31 && roll <= 70) {
                hitSequence = hitArray[3];
            }
            else if (roll >= 71 && roll <= 85) {
                hitSequence = hitArray[4];
            }
            else if (roll >= 86 && roll <= 100) {
                hitSequence = hitArray[5];
            }

            if (hitNumber >= (hitSequence.length - 1)) {
                hitNumber = (hitSequence.length - 1);
            }

            return hitSequence[hitNumber];
        }

        function reverseRoll(roll) {
            var singles = (roll % 10);
            var tens = (roll - singles);
            return (singles * 10) + (tens / 10);
        }

        function determineRof() {
            if (params.autoFire == 0) {
                params["shells"] = parseInt(getWeaponValue("rangedweaponsingle"));
            }
            else if (params.autoFire == 10) {
                params["shells"] = parseInt(getWeaponValue("rangedweaponsemi"));
            }
            else if (params.autoFire == 20) {
                params["shells"] = parseInt(getWeaponValue("rangedweaponfull"));
            }
        }

        function findWeaponID() {
            var myRow = findObjs({ type: 'attribute', characterid: params.characterID }).filter(x => x.get("name").includes("rw_row_id") && x.get("current") == params.weaponID)[0];
            if (myRow) {
                var myRowID = myRow.get("name").replace("repeating_rangedweapons_", "");
                myRowID = myRowID.replace("_rw_row_id", "");
                params.weaponRowID = myRowID;
            }
            else {
                logMessage("Cannot find weapon for " + params.characterName + " and row id " + params.weaponID, true);
            }
        }

        function getWeaponValue(name, isRequired) {
            var attrName = "repeating_rangedweapons_" + params.weaponRowID + "_" + name;
            var myRow = findObjs({ type: 'attribute', characterid: params.characterID, name: attrName })[0]
            if (myRow) {
                return myRow.get("current");
            }
            else {
                if (isRequired) {
                    logMessage("Missing Row for " + attrName);
                    return "Unknown";
                }
                else {
                    return "";
                }
            }
        }

        function getAccurateDamageValues() {
            if (params.aim > 0 && params.accurate && params.autoFire == 0) {
                logMessage("Determine extra accurate damage.")
                if (params.hitsTotal >= 4) {
                    logMessage("4 or more successes.")
                    params.damageRoll = params.damageRoll + " + 2d10"
                }
                else if (params.hitsTotal >= 2) {
                    logMessage("2 or more successes.")
                    params.damageRoll = params.damageRoll + " + 1d10"
                }
            }
        }

        function readCharacterSheet() {
            params["magBonus"] = 0;
            params["ballisticSkill"] = parseInt(getAttrByName(params.characterID, "BallisticSkill"));
            params["ballisticSkillAdv"] = parseInt(getAttrByName(params.characterID, "advanceBS"));
            params["weaponName"] = getWeaponValue("rangedweaponname", true);
            params["weaponSpecial"] = getWeaponValue("rangedweaponspecial", false).toLowerCase();
            params["damageRoll"] = getWeaponValue("rangedweapondamage", true);
            params["damageType"] = getWeaponValue("rangedweapontype", true);
            params["currentClip"] = parseInt(getWeaponValue("rangedweaponclip", true));
            params["penetration"] = parseInt(getWeaponValue("rangedweaponpen", true));
            params["charType"] = "NPC";
            var player_obj = getObj("player", msg.playerid);
            params["bgColor"] = player_obj.get("color");

            getWeaponQualityBasic("accurate", params);
            getWeaponQualityBasic("hellfire", params);
            getWeaponQualityBasic("kraken", params);
            getWeaponQualityBasic("toxic", params);
            getWeaponQualityBasic("reliable", params);
            getWeaponQualityBasic("living_ammo", params);
            getWeaponQualityInteger("blast", params)
            getWeaponQualityInteger("felling", params)

            if (params.accurate && params.aim > 0) {
                processAccurateQuality(params)
            }

            if (params.kraken) {
                processKrakenQuality(params)
            }

            var value = findObjs({ type: 'attribute', characterid: params.characterID, name: "charType" })[0];
            if (value) {
                params["charType"] = value.get('current').toUpperCase();
            }

            var token = findObjs({ type: 'graphic', _id: params.targetID })[0];
            params["targetName"] = "Something";
            if (token) {
                params["targetName"] = token.get("name");
                params["tarType"] = "NPC";
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

        function findHordeDamageBonus() {
            logMessage("Finding Horde Damage Bonus" + params.selectedTokenID);
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
            sendChatMessage += `\n--+ | [sheetbutton]Attempt Dodge?::${params.targetCharID}::dodge[/sheetbutton]`;
            sendChatMessage += `\n--+ | [rbutton]Apply Damage!:: EXEC_DAMAGE[/rbutton] [rbutton]Attack Dodged:: EXEC_DODGED[/rbutton]`;
            sendChatMessage += `\n--X |`;
            sendChatMessage += `\n--: EXEC_DAMAGE|`;
            sendChatMessage += `\n--#title | ${params.characterName} damages ${params.targetName}`;
            params.fullModifier - params.rfRoll >= 0 ? sendChatMessage += `\n--+Righteous Fury:|Confirmed` : null;
            if (params.fullModifier - params.rfRoll <= 0) {
                // RF is not confirmed so clear the exploding dice modifier
                params.damageRoll = params.damageRoll.replace("!", "")
            }
            else {
                // we have a RF hit.   So we need to apply RF damage extra if hell fire
                if (params.hellfire) {
                    // if we have hellfire ammo trigger RF on things greater than 9
                    params.damageRoll = params.damageRoll.replace("!", "!>9")
                }
            }

            getAccurateDamageValues()

            sendChatMessage += `\n--+Damage Type:|${params.damageType}`;
            sendChatMessage += `\n--+Penetration:|${params.penetration}`;
            sendChatMessage += `\n--@vfx_opt|${params.targetID} BloodSplat`;
            var awValue = "";
            for (lcv = 0; lcv < params.hits; lcv++) {
                var whereHit = getHit(reverseRoll(params.hitRoll), lcv);
                sendChatMessage += `\n--=Damage${lcv}|[[${params.damageRoll}]]`;
                sendChatMessage += `\n--+Hit ${lcv + 1}:|${whereHit} for [$Damage${lcv}]`;
                lcv > 0 ? awValue += ";" : null;
                awValue += `${whereHit}-[$Damage${lcv}]`;
            }

            sendChatMessage += `\n--@DW_ApplyWounds|_targetCharID|${params.targetCharID} _tarTokenID|${params.targetID} _pen|${params.penetration} _hits|${awValue} _alterBar|1 _felling|${params.felling} _hellfire|${params.hellfire} _blast|${params.blast} _toxic|${params.toxic}`;
            sendChatMessage = addReduceAmmo(sendChatMessage, params)
            sendChatMessage += `\n--X |`;
            sendChatMessage += `\n--: EXEC_DODGED|`;
            sendChatMessage += `\n--#title |  ${params.targetName} dodges attack from ${params.characterName}`;
            sendChatMessage = addReduceAmmo(sendChatMessage, params)
            sendChatMessage += `\n--X |`;
            return sendChatMessage;
        }

        function processAccurateQuality(params) {
            logMessage("Adding Accurate bonus")
            params.aim += 10
        }

        function processKrakenQuality(params) {
            logMessage("Adding kraken penetration")
            if (params.penetration < 8) {
                params.penetration = 8
            }
        }

        function getChatHeader(sendChatMessage) {
            sendChatMessage += `\n--#title|${params.characterName} is firing at ${params.targetName}!`;
            sendChatMessage += `\n--#titleCardBackground|${params.bgColor}`;
            sendChatMessage += `\n--#subtitleFontSize|10px`;
            sendChatMessage += `\n--#subtitleFontColor|#000000`;
            sendChatMessage += `\n--#leftsub|${params.weaponName}`;
            sendChatMessage += `\n--#rightsub|${params.weaponSpecial}`;

            return sendChatMessage
        }

        function getJamSection(sendChatMessage, params) {
            params["isJammed"] = false
            if (params.hitRoll > params.jamTarget && params.rejam == 10) {
                sendChatMessage += `\n--+|[img](https://media.giphy.com/media/3o6Mb4LzCRqyjIJ4TC/giphy.gif)`;
                sendChatMessage += `\n--+JAMMED:|(${params.hitRoll})`
                sendChatMessage = addReduceAmmo(sendChatMessage, params, 1)
                params.isJammed = true
            }

            return sendChatMessage;
        }

        function getClipAmount(sendChatMessage, params) {
            params["enoughAmmo"] = true
            if (params.currentClip < params.shells) {
                if (params.currentClip > 0) {
                    sendChatMessage += `\n--+Not Enough Ammo:|Has only ${params.currentClip} in clip.`;
                    params.shells = params.currentClip
                }
                else {
                    params.enoughAmmo = false
                    sendChatMessage += `\n--+Not Enough Ammo`;
                    sendChatMessage += `\n--+Current Clip:|${params.currentClip}`;
                    sendChatMessage += `\n--+Shells Needed:|${params.shells}`;
                }
            }

            return sendChatMessage;
        }

        function getNormalAttack(sendChatMessage, params) {
            if (params.isjammed || !params.enoughAmmo) {
                return sendChatMessage
            }

            sendChatMessage += `\n--+|[img](https://media.giphy.com/media/llD9NuPzxOCuzmnbMq/giphy.gif)`;
            sendChatMessage += `\n--+Skill:|${params.ballisticSkill}`;
            sendChatMessage += `\n--+Skill Advance:|${params.ballisticSkillAdv}`;
            params.range != 0 ? sendChatMessage += `\n--+Range Modifier:|${params.range}` : null;
            params.aim != 0 ? sendChatMessage += `\n--+Aim Modifier:|${params.aim}` : null;
            params.autoFire != 0 ? sendChatMessage += `\n--+Rate of Fire Modifier:|${params.autoFire}` : null;
            params.calledShot != 0 ? sendChatMessage += `\n--+Called Shot Modifier:|${params.calledShot}` : null;
            params.runningTarget != 0 ? sendChatMessage += `\n--+Running Target Modifier:|${params.runningTarget}` : null;
            params.miscModifier != 0 ? sendChatMessage += `\n--+Misc Modifier:|${params.miscModifier}` : null;
            params.magBonus != 0 ? sendChatMessage += `\n--+Horde Size Modifier:|${params.magBonus}` : null;
            sendChatMessage += `\n--+Total Modifier:|${params.fullModifier}`;
            sendChatMessage += `\n--+HitRoll:|${params.hitRoll}`;
            sendChatMessage += `\n--+Hits:|${params.hits}`;
            sendChatMessage += `\n--+Shells Used:|${params.shells}`;
            if (params.hits > 0) {
                sendChatMessage = buildDamageButton(sendChatMessage)
            }
            else {
                // even if no hits we reduce ammo
                sendChatMessage = addReduceAmmo(sendChatMessage, params)
            }

            return sendChatMessage
        }

        function addReduceAmmo(sendChatMessage, params, shells = params.shells) {
            sendChatMessage += `\n--@DW_ReduceAmmo|_characterName|${params.characterName} _characterID|${params.characterID} _weaponID|${params.weaponID} _amount|${shells}`;
            return sendChatMessage;
        }

        function determineHitsAndJam(params) {

            params["fullModifier"] = params.ballisticSkill + params.ballisticSkillAdv + params.range + params.aim + params.autoFire + params.calledShot + params.runningTarget + params.miscModifier + params.magBonus;

            // Determine the Jam target.   When autofire jams are more frequent
            params["jamTarget"] = params.autoFire > 0 ? 94 : 96;
            if (params.living_ammo) {
                // if no jam is set then this weapon cannot be jammed.
                // Set the jam target to 110 (Which cannot be rolled)
                params.jamTarget = 110
            }

            // Determine hits and RF roll.
            params["hitRoll"] = randomInteger(100);
            if (params.charType == "PLAYER") {
                params["rfRoll"] = randomInteger(100);
            }
            else {
                params["rfRoll"] = 10000;
            }

            // if weapon is reliable then roll 1d10 for jam otherwise assume 10 for jam.
            params["rejam"] = params.reliable ? randomInteger(10) : 10;
            params["hitsTotal"] = 0;
            if ((params.fullModifier - params.hitRoll) >= 0) {
                // we have a hit
                params["hitsTotal"] = 1;
                // determine how many successes every 10 add in theory another hit
                params["hitsTotal"] += Math.trunc((params.fullModifier - params.hitRoll) / 10);
            }

            params["hits"] = params.hitsTotal > 0 ? (params.hitsTotal > params.shells ? params.shells : params.hitsTotal) : 0;
            params["rollValue"] = `[${params.fullModifier} Mods - ${params.hitRoll} Hit Roll]`

        }

        args = msg.content.split("--");

        // parse all the arguments
        parseArgs(args);

        // Validate the integer arguments
        validateIntArgs();

        // find weapon ID;
        findWeaponID();

        // read values off the character sheet
        readCharacterSheet();

        // Now determine the rof values.
        determineRof();

        if (params.charType == "HORDE") {
            // character is a horde find out any bonus to damage
            findHordeDamageBonus();
        }

        // output parameters to the log
        logMessage(params);

        var sendChatMessage = "!script {{";
        sendChatMessage = getChatHeader(sendChatMessage)
        sendChatMessage = getClipAmount(sendChatMessage, params)
        determineHitsAndJam(params)
        sendChatMessage = getJamSection(sendChatMessage, params)
        sendChatMessage = getNormalAttack(sendChatMessage, params)
        sendChatMessage += "\n}}";

        logMessage(sendChatMessage);
        sendChat("From", sendChatMessage);
    }
});