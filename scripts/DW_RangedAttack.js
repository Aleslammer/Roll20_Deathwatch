on("ready", function () {
    var version = '0.2.4';
	log("-=> DW_RangedAttack v" + version + " Loaded ");
});
on("chat:message", function(msg){
    if (msg.type=="api" && msg.content.indexOf("!DW_RangedAttack") == 0)
    {
        const showLog = false;

        var params = {}

        function logMessage(message, override = false)
        {
            if (showLog || override)
            {
                log(message)
            }
        }

        function parseArgs(args){
            for(lcv = 1; lcv < args.length; lcv++)
            {
                var splitValue = args[lcv].trim().split("|");
                var key = splitValue[0];
                var value = splitValue[1];
                params[key] = value;
            }
        }

        function validateIntArgs()
        {
            params.range = parseInt(params.range);
            params.aim = parseInt(params.aim);
            params.autoFire = parseInt(params.autoFire);
            params.calledShot = parseInt(params.calledShot);
            params.runningTarget = parseInt(params.runningTarget);
            params.miscModifier = parseInt(params.miscModifier);
        }

        function getSide(){
            var sideArray = ["Right", "Left"];    
            return sideArray[Math.floor(Math.random()*sideArray.length)];
        }

        function getHit(roll, hitNumber){

            var hitArray = [
                ["Head", "Head", getSide() + " Arm", "Body", getSide() + " Arm", "Body"],
                ["Right Arm", getSide() + " Arm", "Body", "Head", "Body", getSide() + " Arm"],
                ["Left Arm", getSide() + " Arm", "Body", "Head", "Body", getSide() + " Arm"],
                ["Body", "Body", getSide() + " Arm", "Head", getSide() + " Arm", "Body"],
                ["Right Leg", getSide() + " Leg", "Body", getSide() + " Arm", "Head", "Body"],
                ["Left Leg", getSide() + " Leg", "Body", getSide() + " Arm", "Head", "Body"]
            ];
            
            var hitSequence;
            if (roll >= 1 && roll <=10)
            {
                hitSequence = hitArray[0];
            }
            else if (roll >= 11 && roll <=20)
            {
                hitSequence = hitArray[1];
            }
            else if (roll >= 21 && roll <=30)
            {
                hitSequence = hitArray[2];
            }
            else if (roll >= 31 && roll <= 70)
            {
                hitSequence = hitArray[3];
            }
            else if(roll >= 71 && roll <= 85)
            {
                hitSequence = hitArray[4];
            }
            else if(roll >= 86 && roll <= 100)
            {
                hitSequence = hitArray[5];
            }
            
            if (hitNumber >= (hitSequence.length -1))
            {
                hitNumber = (hitSequence.length -1);
            }

            return hitSequence[hitNumber];             
        }

        function reverseRoll(roll)
        {
            var singles = (roll%10);
            var tens = (roll-singles);
            return (singles*10)+(tens/10);    
        }

        function determineRof()
        {
            if (params.autoFire == 0)
            {
                params["shells"] = parseInt(getWeaponValue("rangedweaponsingle"));
            }
            else if (params.autoFire == 10)
            {
                params["shells"] = parseInt(getWeaponValue("rangedweaponsemi"));
            }
            else if (params.autoFire == 20)
            {
                params["shells"] = parseInt(getWeaponValue("rangedweaponfull"));
            }
        }

        function findWeaponID()
        {
            var myRow = findObjs({ type: 'attribute', characterid: params.characterID }).filter(x => x.get("name").includes("rw_row_id") && x.get("current") == params.weaponID)[0];
            if (myRow)
            {
                var myRowID = myRow.get("name").replace("repeating_rangedweapons_", "");
                myRowID = myRowID.replace("_rw_row_id", "");
                params.weaponRowID = myRowID;
            }
            else
            {
                logMessage("Cannot find weapon for " + params.characterName + " and row id " + params.weaponID, true);
            }
        }

        function reduceAmmo()
        {       
            var myRow = findObjs({ type: 'attribute', characterid: params.characterID }).filter(x => x.get("name").includes("rw_row_id") && x.get("current") == params.weaponID)[0];
            if (myRow)
            {
                var attrName = "repeating_rangedweapons_"+params.weaponRowID+"_rangedweaponclip";
                var myRow = findObjs({ type: 'attribute', characterid: params.characterID, name: attrName })[0]
                if (myRow)
                {
                    var currentValue = parseInt(myRow.get("current"));
                    myRow.set("current", currentValue - params.shells)
                }
                else
                {
                    logMessage("Missing Row for " + attrName, true);
                }
            }
            else
            {
                logMessage("Missing Row for Ammo Update on " + params.characterName, true);
            }
        }

        function getWeaponValue(name, isRequired)
        {
            var attrName = "repeating_rangedweapons_"+params.weaponRowID+"_"+name;
            var myRow = findObjs({ type: 'attribute', characterid: params.characterID, name: attrName })[0]
            if (myRow)
            {
                return myRow.get("current");
            }
            else
            {
                if (isRequired)
                {
                    logMessage("Missing Row for " + attrName);
                    return "Unknown";
                }
                else
                {
                    return "";
                }
            }
        }

        function getAccurateDamageValues()
        {
            if (params.aim > 0 && params.weapon_accurate > 0 && params.autoFire == 0)
            {
                log("Determine extra accurate damage.")
                if (params.hitsTotal >= 4)
                {
                    log("4 or more successes.")
                    params.damageRoll = params.damageRoll + " + 2d10"
                }
                else if (params.hitsTotal >= 2)
                {
                    log("2 or more successes.")
                    params.damageRoll = params.damageRoll + " + 1d10"
                }
            }

        }

        function readCharacterSheet()
        {
            params["magBonus"] = 0;
            params["ballisticSkill"] = parseInt(getAttrByName(params.characterID, "BallisticSkill"));
            params["ballisticSkillAdv"] = parseInt(getAttrByName(params.characterID, "advanceBS"));
            params["weaponName"] = getWeaponValue("rangedweaponname", true);
            params["weaponSpecial"] = getWeaponValue("rangedweaponspecial");
            params["damageRoll"] = getWeaponValue("rangedweapondamage", true);
            params["damageType"] = getWeaponValue("rangedweapontype", true);
            params["currentClip"] = parseInt(getWeaponValue("rangedweaponclip", true));
            params["penetration"] = parseInt(getWeaponValue("rangedweaponpen", true));
            params["charType"] = "NPC";
            var player_obj = getObj("player", msg.playerid);
            params["bgColor"] =  player_obj.get("color");
            params["weapon_accurate"] = 0

            if (params.weaponSpecial.toLowerCase().includes("accurate") && params.aim > 0)
            {
                log("Adding Accurate bonus")
                params["weapon_accurate"] = 1
                params.aim += 10
            }

            var value = findObjs({type: 'attribute', characterid: params.characterID, name: "charType"})[0];
            if (value)
            {
                params["charType"] = value.get('current').toUpperCase();
            }

            var token = findObjs({ type: 'graphic', _id: params.targetID })[0];
            params["targetName"] = "Something";
            if (token)
            {
                params["targetName"] = token.get("name");
                params["tarType"] = "NPC";
                var value = findObjs({type: 'attribute', characterid: params.targetCharID, name: "charType"})[0];
                if (value)
                {
                    params["tarType"] = value.get('current').toUpperCase();
                    if (params.tarType == "HORDE")
                    {
                        params["tarMag"] = parseInt(token.get("bar1_max")) - parseInt(token.get("bar1_value"));
                        if (params.tarMag >= 120)
                        {
                            params.magBonus = 60;
                        }
                        else if (params.tarMag >= 90)
                        {
                            params.magBonus = 50;
                        }
                        else if (params.tarMag >= 60)
                        {
                            params.magBonus = 40;
                        }
                        else if (params.tarMag >= 30)
                        {
                            params.magBonus = 30;
                        }          
                    }
                }
            }
        }

        function findHordeDamageBonus()
        {
            logMessage("Finding Horde Damage Bonus" + params.charTokenID);
            var token = findObjs({ type: 'graphic', _id: params.charTokenID })[0];
            if (token)
            {
                var charMag = parseInt(token.get("bar1_max")) - parseInt(token.get("bar1_value"));
                params["hordeBonus"] = Math.trunc(charMag / 10) + "d10";
                params.damageRoll = params.damageRoll + " + " + params.hordeBonus;
            }
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

        if (params.charType == "HORDE")
        {
            // character is a horde find out any bonus to damage
            findHordeDamageBonus();
        }
      
        params["fullModifier"] = params.ballisticSkill + params.ballisticSkillAdv + params.range + params.aim + params.autoFire + params.calledShot + params.runningTarget + params.miscModifier + params.magBonus;
        
        // Determine the Jam target.   When autofire jams are more frequent
        params["jamTarget"] = params.autoFire > 0 ? 94 : 96;
        
        // Determine hits and RF roll.
        params["hitRoll"] = randomInteger(100);
        params["rfRoll"] = randomInteger(100);
        params["hitsTotal"] = Math.trunc((params.fullModifier - params.hitRoll) / 10);
        params["hits"] = params.hitsTotal > 0 ? (params.hitsTotal > params.shells ? params.shells : params.hitsTotal) : 0;
        params["rollValue"] = `[${params.fullModifier} Mods - ${params.hitRoll} Hit Roll]`

        // output parameters to the log
        logMessage(params);

        var sendChatMessage ="";
        const powerCardStart = "!power {{";
        const powerCardStop = "\n}}";

        sendChatMessage += powerCardStart;
        sendChatMessage += `\n--name|${params.characterName} is firing at ${params.targetName}!`;
        sendChatMessage += `\n--bgcolor|${params.bgColor}`;
        sendChatMessage += `\n--leftsub|${params.weaponName}`;
        sendChatMessage += `\n--rightsub|${params.weaponSpecial}`;
        if (params.hitRoll > params.jamTarget)
        {
            sendChatMessage += `\n--!showpic|[x](https://media.giphy.com/media/3o6Mb4LzCRqyjIJ4TC/giphy.gif)`;
            sendChatMessage += `\n--JAMMED:|(${params.hitRoll})` 
            reduceAmmo();
        }
        else if (params.currentClip < params.shells)
        {
            sendChatMessage += `\n--Not Enough Ammo`;
            sendChatMessage += `\n--Current Clip:|${params.currentClip}`;
            sendChatMessage += `\n--Shells Needed:|${params.shells}`;
        }
        else
        {
            sendChatMessage += `\n--!showpic|[x](https://media.giphy.com/media/llD9NuPzxOCuzmnbMq/giphy.gif)`;
            params.range != 0 ? sendChatMessage += `\n--Range Modifier:|${params.range}` : null;
            params.aim != 0 ? sendChatMessage += `\n--Aim Modifier:|${params.aim}` : null;
            params.autoFire != 0 ? sendChatMessage += `\n--Rate of Fire Modifier:|${params.autoFire}` : null;
            params.calledShot != 0 ? sendChatMessage += `\n--Called Shot Modifier:|${params.calledShot}` : null;
            params.runningTarget != 0 ? sendChatMessage += `\n--Running Target Modifier:|${params.runningTarget}` : null;
            params.miscModifier != 0 ? sendChatMessage += `\n--Misc Modifier:|${params.miscModifier}` : null;
            params.magBonus != 0 ? sendChatMessage += `\n--Horde Size Modifier:|${params.magBonus}` : null;
            sendChatMessage += `\n--Shells:|${params.shells}`;
            sendChatMessage += `\n--Hits:|[[${params.hits}${params.rollValue}]]`;
            if (params.hits > 0 )
            {
                params.fullModifier - params.rfRoll > 0 ? sendChatMessage += `\n--Righteous Fury:|Confirmed` : null;
                if (params.fullModifier - params.rfRoll <= 0)
                {
                    // RF is not confirmed so clear the exploding dice modifier
                    params.damageRoll = params.damageRoll.replace("!", "")
                }
                else
                {
                    // we have a RF hit.   So we need to apply RF damage extra if hell fire
                    if (params.weaponSpecial.toLowerCase().includes("hellfire"))
                    {
                        // if we have hellfire ammo trigger RF on things greater than 9
                        params.damageRoll = params.damageRoll.replace("!", "!>9")
                    }
                }

                sendChatMessage += `\n--Damage Type:|${params.damageType}`;
                sendChatMessage += `\n--Penetration:|${params.penetration}`;
                sendChatMessage += `\n--vfx_opt|${params.targetID} BloodSplat`;
            }

            getAccurateDamageValues()
            
            var awValue = "";
            for(lcv = 0; lcv < params.hits; lcv++)
            {
                var whereHit = getHit(reverseRoll(params.hitRoll), lcv);
                sendChatMessage += `\n--Hit ${lcv+1}:|${whereHit} for [[ [$Atk${lcv+1}] ${params.damageRoll}]]`;
                lcv > 0 ? awValue+=";" : null;
                awValue += `${whereHit}-[^Atk${lcv+1}]`;
            }
            
            
            // if we hit then add the hits rolls
            if (params.hits > 0 )
            {
                sendChatMessage += `\n--api_DW_ApplyWounds|_targetCharID|${params.targetCharID} _tarTokenID|${params.targetID} _pen|${params.penetration} _hits|${awValue} _alterBar|1`;
            }

            reduceAmmo();
        }
        
        sendChatMessage += powerCardStop;
        logMessage(sendChatMessage);
        sendChat("From", sendChatMessage);
    }
});