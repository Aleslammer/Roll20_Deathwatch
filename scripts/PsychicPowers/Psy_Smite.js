on("ready", function () {
    var version = '0.2.0';
	log("-=> Psy_Smite v" + version + " Loaded ");
});
on("chat:message", function(msg){
    if (msg.type=="api" && msg.content.indexOf("!Psy_Smite") == 0)
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

        function determinePsyRating()
        {
            switch(params.powerLevel) {
                case "Fettered":
                  params.psyRating = Math.round(params.psyRating * 0.5);
                  break;
                case "Push":
                    params.psyRating = params.psyRating + 3;
                  break;
                default:
                    // Do nothing.
                  break;
              }
        }

        function readCharacterSheet()
        {
            params.psyRating = parseInt(getAttrByName(params.characterID, "PsyRating"));            
            // need to determine this now as it effects other values.
            determinePsyRating();
            params["willpower"] = parseInt(getAttrByName(params.characterID, "Willpower"));
            params["willpowerAdv"] = parseInt(getAttrByName(params.characterID, "advanceWP"));

            params["damageRoll"] = `1d10 * ${params.psyRating}`;
            params["datamageType"] = "Energy";
            params["penetration"] = params.psyRating;
            params["powerRange"] = params.psyRating * 10;
        }

        args = msg.content.split("--");

        // parse all the arguments
        parseArgs(args);

        // Validate the integer arguments
        validateIntArgs();

        // read values off the character sheet
        readCharacterSheet();
        
        params["fullModifier"] = params.willpower + params.willpowerAdv + params.range + params.aim + params.calledShot + params.runningTarget + params.miscModifier + (5 * params.psyRating);
        
        // Determine the Jam target.
        params["jamTarget"] = 91;
        
        // Determine hits and RF roll.
        params["hitRoll"] = randomInteger(100);
        params["rfRoll"] = randomInteger(100);
        params["hitsTotal"] = Math.floor((params.fullModifier - params.hitRoll) / 10);
        params["hits"] = params.hitsTotal > 0 ? 1 : 0;
        params["hordeHits"] = params.psyRating;

        // output parameters to the log
        logMessage(params);

        var sendChatMessage ="";
        const powerCardStart = "!power {{";
        const powerCardStop = "\n}}";

        sendChatMessage += powerCardStart;
        sendChatMessage += `\n--name|${params.characterName} summons the warp to smite his enemies!`;
        sendChatMessage += `\n--leftsub|Range ${params.powerRange}`;
        sendChatMessage += `\n--rightsub|PsyRating ${params.psyRating}`;
        if (params.hitRoll > params.jamTarget)
        {
            sendChatMessage += `\n--Power Level:|${params.powerLevel}`;
            sendChatMessage += `\n--And is Denied:|${params.hitRoll}`;
        }
        else
        {
            if (((params.hitRoll % 11) == 0) || (params.powerLevel == "Push"))
            {
                sendChatMessage += `\n--!showpic|[x](https://media.giphy.com/media/L4TNHVeOP0WrWyXT5m/giphy.gif)`;
                sendChatMessage += `\n--PERIL OF THE WARP!:|Hit Roll - ${params.hitRoll} Psychic Phenomena - [[1d100]]`;
            }
            else
            {
                sendChatMessage += `\n--!showpic|[x](https://media.giphy.com/media/WprqYyQgk0iGlQ5QzD/giphy.gif)`;
            }

            sendChatMessage += `\n--Power Level:|${params.powerLevel}`;
            params.range != 0 ? sendChatMessage += `\n--Range Modifier:|${params.range}` : null;
            params.aim != 0 ? sendChatMessage += `\n--Aim Modifier:|${params.aim}` : null;
            params.calledShot != 0 ? sendChatMessage += `\n--Called Shot Modifier:|${params.calledShot}` : null;
            params.runningTarget != 0 ? sendChatMessage += `\n--Running Target Modifier:|${params.runningTarget}` : null;
            params.miscModifier != 0 ? sendChatMessage += `\n--Misc Modifier:|${params.miscModifier}` : null;
            sendChatMessage += `\n--Hits:|[[${params.hits}]]`;
            params.hits > 0 ? sendChatMessage += `\n--Horde Hits:|[[${params.hordeHits}]]` : null;
            params.hits > 0 ? (params.fullModifier - params.rfRoll > 0 ? sendChatMessage += `\n--Righteous Fury:|Confirmed` : null) : null;
            params.hits > 0 ? sendChatMessage += `\n--Penetration:|${params.penetration}` : null;
            sendChatMessage += `\n--vfx_opt|${params.tokenID} ${params.targetID} LightningBolt`
            var awValue = "";
            for(lcv = 0; lcv < params.hits; lcv++)
            {
                var whereHit = getHit(reverseRoll(params.hitRoll), lcv);
                sendChatMessage += `\n--Hit ${lcv+1}:|${whereHit} for [[ [$Atk${lcv+1}] ${params.damageRoll}]]`;
                lcv > 0 ? awValue+=";" : null;
                awValue += `${whereHit}-[^Atk${lcv+1}]`;
            }
            
            // if we hit then add the hits rolls
            if (params.hits > 0)
            {
                sendChatMessage += `\n--api_DW_ApplyWounds|_targetCharID|${params.targetCharID} _tarTokenID|${params.targetID} _pen|${params.penetration} _hits|${awValue}`;
            }
        }
        
        sendChatMessage += powerCardStop;        
        logMessage(sendChatMessage);
        sendChat("From", sendChatMessage);
    }
});