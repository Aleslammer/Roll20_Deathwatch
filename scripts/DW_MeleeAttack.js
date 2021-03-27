on("ready", function () {
    var version = '0.2.0';
	log("-=> DW_MeleeAttack v" + version + " Loaded ");
});
on("chat:message", function(msg){
    if (msg.type=="api" && msg.content.indexOf("!DW_MeleeAttack") == 0)
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
            params.aim = parseInt(params.aim);
            params.charge = parseInt(params.charge);
            params.allOut = parseInt(params.allOut);
            params.calledShot = parseInt(params.calledShot);
            params.runningTarget = parseInt(params.runningTarget);
            params.miscModifier = parseInt(params.miscModifier);
            params.strengthBonus = parseInt(params.strengthBonus);
            params.powerLevel = parseInt(params.powerLevel);
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
                hitsequence = hitArray[0];
            }
            else if (roll >= 11 && roll <=20)
            {
                hitsequence = hitArray[1];
            }
            else if (roll >= 21 && roll <=30)
            {
                hitsequence = hitArray[2];
            }
            else if (roll >= 31 && roll <= 70)
            {
                hitsequence = hitArray[3];
            }
            else if(roll >= 71 && roll <= 85)
            {
                hitsequence = hitArray[4];
            }
            else if(roll >= 86 && roll <= 100)
            {
                hitsequence = hitArray[5];
            }
            
            if (hitNumber >= (hitsequence.length -1))
            {
                hitNumber = (hitsequence.length -1);
            }

            return hitsequence[hitNumber];
        }

        function reverseRoll(roll)
        {
            var singles = (roll%10);
            var tens = (roll-singles);
            return (singles*10)+(tens/10);    
        }

        function findWeaponID()
        {
            var myRow = findObjs({ type: 'attribute', characterid: params.characterID }).filter(x =>x.get("name").includes("mw_row_id") && x.get("current") == params.weaponID)[0];
            if (myRow)
            {
                var myRowID = myRow.get("name").replace("repeating_meleeweapons_", "");
                myRowID = myRowID.replace("_mw_row_id", "");
                params.weaponRowID = myRowID;
            }
            else
            {
                logMessage("Cannot find weapon for " + params.characterName + " and row id " + params.weaponID, true);
            }
        }

        function getWeaponValue(name, isRequired)
        {
            var attrName = "repeating_meleeweapons_"+params.weaponRowID+"_"+name;
            var myRow = findObjs({ type: 'attribute', characterid: params.characterID, name: attrName })[0]
            if (myRow)
            {
                return myRow.get("current");
            }
            else
            {
                if (isRequired)
                {
                    logMessage("Missing Row for " + attrName, true);
                    return "Unkown";
                }
                else
                {
                    return "";
                }
            }
        }

        function readCharacterSheet()
        {
            params["weaponSkill"] = parseInt(getAttrByName(params.characterID, "WeaponSkill"));
            params["weaponSkillAdv"] = parseInt(getAttrByName(params.characterID, "advanceWS"));
            params["weaponName"] = getWeaponValue("meleeweaponname", true);
            params["weaponSpecial"] = getWeaponValue("meleeweaponspecial");
            params["penetration"] = parseInt(getWeaponValue("meleeweaponpen", true));
            params["damageType"] = getWeaponValue("meleeweapontype", true);
            params["damageRoll"] = getWeaponValue("meleeweapondamage", true);
            if (params.powerLevel > 0)
            {
                params["psyRating"] = parseInt(getAttrByName(params.characterID, "PsyRating"));
                if (params.powerLevel == 1)
                {
                    // if fetter use half the power
                    params.psyRating = Math.round(params.psyRating / 2);
                }
                else if (params.powerLevel == 3)
                {
                    // if push use plus the level
                    params.psyRating = params.psyRating + params.powerLevel;
                }

                params["damageRoll"] = params.damageRoll + " + " +params.psyRating;
                params["penetration"] = params.penetration + params.psyRating;
                params["willpower"] = parseInt(getAttrByName(params.characterID, "Willpower"));
                params["willpowerAdv"] = parseInt(getAttrByName(params.characterID, "advanceWP"));
            }

            var token = findObjs({ type: 'graphic', _id: params.targetID })[0];
            params["targetName"] = "Something";
            if (token)
            {
                params["targetName"] = token.get("name");
            }

            if (params.powerLevel > 0)
            {
                params["tarWillpower"] = parseInt(getAttrByName(params.targetCharID, "Willpower"));
                params["tarWillpowerAdv"] = parseInt(getAttrByName(params.targetCharID, "advanceWP"));     
            }

        }

        args = msg.content.split("--");

        // parse all the arguments
        parseArgs(args);

        // Validate the integer arguments
        validateIntArgs();

        // find the weapon id for the weapon provided.
        findWeaponID();

        // read values off the character sheet
        readCharacterSheet();
        
        params["fullModifier"] = params.weaponSkill + params.weaponSkillAdv + params.aim + params.allOut + params.calledShot + params.charge + params.runningTarget + params.miscModifier;
       
        // Determine hits and RF roll.
        params["hitRoll"] = randomInteger(100);
        params["rfRoll"] = randomInteger(100);
        params["hitsTotal"] = Math.trunc((params.fullModifier - params.hitRoll) / 10);
        params["hits"] = params.hitsTotal > 0 ? 1 : 0;
        params["hordeHits"] = params.hitsTotal > 0 ? (params.hitsTotal > 2 ? Math.trunc(params.hitsTotal / 2) : 1) : 0;
        params["rollValue"] = `[${params.fullModifier} Mods - ${params.hitRoll} Hit Roll]`

        if (params.psyRating != "NaN" && params.hits > 0 && params.powerLevel > 0)
        {
            // we have a force weapon and need to calcuate extra damage.
            params["willRoll"] = randomInteger(100);
            params["willRollMod"] = (params.willpower + params.willpowerAdv + (5 * params.psyRating)) - params.willRoll;
            params["tarWillRoll"] = (params.tarWillpower + params.tarWillpowerAdv) - randomInteger(100);
            params["willDos"] = Math.trunc(params.willRollMod / 10);
            params["tarWillDos"] = Math.trunc(params.tarWillRoll / 10);
            if (params.willDos > 0 && params.willDos > params.tarWillDos)
            {
                params["forceDamage"] = `${params.willDos}d10`;
            }
        }

        // output parameters to the log
        logMessage(params);

        var sendChatMessage ="";
        const powerCardStart = "!power {{";
        const powerCardStop = "\n}}";

        sendChatMessage += powerCardStart;
        sendChatMessage += `\n--name|${params.characterName} is attacking ${params.targetName}!`;
        sendChatMessage += `\n--leftsub|${params.weaponName}`;
        sendChatMessage += `\n--rightsub|${params.weaponSpecial}`;
        sendChatMessage += `\n--!showpic|[x](https://thumbs.gfycat.com/TinyBitesizedKilldeer-size_restricted.gif)`;
        params.aim != 0 ? sendChatMessage += `\n--Aim Modifier:|${params.aim}` : null;
        params.allOut != 0 ? sendChatMessage += `\n--All Out Modifier:|${params.allOut}` : null;
        params.calledShot != 0 ? sendChatMessage += `\n--Called Shot Modifier:|${params.calledShot}` : null;
        params.charge != 0 ? sendChatMessage += `\n--Charge Modifier:|${params.charge}` : null;
        params.runningTarget != 0 ? sendChatMessage += `\n--Running Target Modifier:|${params.runningTarget}` : null;
        params.miscModifier != 0 ? sendChatMessage += `\n--Misc Modifier:|${params.miscModifier}` : null;
        sendChatMessage += `\n--Hits:|[[${params.hits} ${params.rollValue}]]`;
        sendChatMessage += `\n--Horde Hits:|[[${params.hordeHits}]]`;
        if (params.hits > 0)
        {
            params.fullModifier - params.rfRoll > 0 ? sendChatMessage += `\n--Righteous Fury:|Confirmed` : null;
            sendChatMessage += `\n--Damage Type:|${params.damageType}`;
            sendChatMessage += `\n--Penetration:|${params.penetration}`;
            sendChatMessage += `\n--vfx_opt|${params.targetID} BloodSplat`;
            if (params.powerLevel > 0)
            {
                sendChatMessage += `\n--Willpower Test:|Yours [[${params.willDos} [${params.willRollMod}]]] vs ${params.targetName}[[${params.tarWillDos} [${params.tarWillRoll}]]]`;
                params.forceDamage ? sendChatMessage += `\n--Force Damage:|[[${params.forceDamage}]]` : null;
                if ((((params.willRoll % 11) == 0) && params.powerLevel == 2) || (params.powerLevel == 3))
                {
                    sendChatMessage += `\n--!showpic|[x](https://media.giphy.com/media/L4TNHVeOP0WrWyXT5m/giphy.gif)`;
                    sendChatMessage += `\n--PERIL OF THE WARP!:|Will Roll - ${params.willRoll} Psychic Phenomena - [[1d100]]`;
                }    
            }
        }

        var awValue = "";
        for(lcv = 0; lcv < params.hits; lcv++)
        {
            var whereHit = getHit(reverseRoll(params.hitRoll), lcv);
            sendChatMessage += `\n--Hit ${lcv+1}:|${whereHit} for [[ [$Atk${lcv+1}] ${params.damageRoll}+[[${params.strengthBonus}]]]]`;
            lcv > 0 ? awValue+=";" : null;
            awValue += `${whereHit}-[^Atk${lcv+1}]`;
        }
        
        // if we hit then add the hits rolls
        if (params.hits > 0)
        {
            sendChatMessage += `\n--api_DW_ApplyWounds|_targetCharID|${params.targetCharID} _tarTokenID|${params.targetID} _pen|${params.penetration} _hits|${awValue}`;
        }

        sendChatMessage += powerCardStop;
        logMessage(sendChatMessage);
        sendChat("From", sendChatMessage);
    }
});

