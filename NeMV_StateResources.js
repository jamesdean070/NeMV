//=============================================================================
// NeMV - State Resources
// NeMV_StateResources.js
//=============================================================================

var Imported = Imported || {};
Imported.NeMV_StateResources = true;

var NeMV = NeMV || {};
NeMV.SR = NeMV.SR || {};

//=============================================================================
 /*:
 * @plugindesc v1.0 (Requires YEP_BuffsStatesCore.js & YEP_SkillCore.js) Grants resource pools in the form of states.
 * @author Nekoyoubi
 *
 * @param --- Misc. ---
 * @default
 *
 * @param Debug State Resources
 * @desc Whether or not to output debug information for State Resources.
 * Example: true (debug) or false (no debug)
 * @default false
 *
 * @help
 * ============================================================================
 * Introduction
 * ============================================================================
 *
 * This plugin grants the ability to quantify states and use them as resources
 * via YEP - Skill Core-friendly notetags.
 *
 * ============================================================================
 * Usage
 * ============================================================================
 *
 * Step 1 ---------------------------------------------------------------------
 *
 * Designate your state to be used as a resource via the following notetag:
 *
 * State  >  Notebox  >  <RESOURCE INITIALVALUE, [MAXVALUE], [RESOURCENAME]>
 *
 * Below are a few of examples of valid State Resource notetags.
 *
 * <Resource 0, 100, Rage>
 * <resource 10 20 Ammo>
 * <RESOURCE 100, 9999>
 *
 * Note that the last example will attempt to only use the state's icon to show
 * the resource cost.
 *
 * Step 2 ---------------------------------------------------------------------
 *
 * Add "SR" costs to your Skills with notetags similar to those found in
 * YEP - Skill Core (albeit slightly modified for our case).
 *
 * Skill  >  Notebox  >  <SR STATEID COST: AMOUNT[%]>
 *
 * The following examples illustrate a couple of valid Skill notetag uses.
 *
 * <SR 19 Cost: 5>
 * <sr 22 cost: 10%>
 *
 * Step 3 ---------------------------------------------------------------------
 *
 * Use the following script commands to retrieve or adjust your current and
 * maximum values of a resource (plugin commands may be added in a future
 * version if wanted/needed).
 *
 * Game_Actor.getSR(state) // Gets the actor's current resource value
 * Game_Actor.setSR(state, amount) // Sets the actor's current resource value
 * Game_Actor.getMaxSR(state) // Gets the actor's max resource value
 * Game_Actor.setMaxSR(state, amount) // Gets the actor's max resource value
 * Game_Actor.adjustSR(state, amount) // Adjusts the actor's current resource
 *
 * Note that the .adjustSR() method's amount can be either positive for adding
 * to the current value (e.g. 10; not +10) or negative to remove from the pool
 * (e.g. -10). This will also constrain the value to a range between zero and
 * the resource's maximum for that actor.
 *
 * ============================================================================
 * Support
 * ============================================================================
 *
 * Should this plugin not work for you for any reason, please notify me by
 * creating a GitHub issue, emailing me at lance-at-nekoyoubi.com, or message
 * me in any social convention you happen to see me in.
 *
 * Thanks, and happy... resourcing?
 *
 * ============================================================================
 * Changelog
 * ============================================================================
 *
 * Version 1.0:
 * - initial plugin
 *
 */
//=============================================================================

// NeMV.SR INITIALIZATION -----------------------------------------------------

NeMV.SR.Resources = [];

NeMV.SR.init = function() {
	if ($dataStates !== null && $dataStates !== undefined) this.processStateNotetags($dataStates);
};

NeMV.SR.processStateNotetags = function(data) {
	var resourceTag = /<(?:RESOURCE (\d+)(?:[,\s]*(\d+))?(?:[,\s]*(\w+))?)>/i;
	for (var n = 1; n < data.length; n++) {
		var obj = data[n];
		if (obj === null || obj === undefined) continue;
		obj.srCount = 0;
		var notelines = obj.note.split(/[\r\n]+/);
		for (var i = 0; i < notelines.length; i++) {
			var line = notelines[i];
			lineMatch = line.match(resourceTag);
			if (lineMatch) {
				NeMV.SR.Resources.push([
					obj.id,
					parseInt(lineMatch[1]),
					parseInt(lineMatch[2]) ? parseInt(lineMatch[2]) : 100,
					lineMatch[3] !== null && lineMatch[3] !== undefined ? lineMatch[3] : ""
				]);
			}
		}
	}
};

// YEP OVERRIDE FOR SKILL NOTETAGS --------------------------------------------

DataManager.processSkillNotetags = function(group) {
  var note1 = /<(?:MP COST):[ ](\d+)>/i;
  var note2 = /<(?:MP COST):[ ](\d+)([%％])>/i;
  var note3 = /<(?:TP COST):[ ](\d+)>/i;
  var note4 = /<(?:TP COST):[ ](\d+)([%％])>/i;
  var note5 = /<(?:HP COST):[ ](\d+)>/i;
  var note6 = /<(?:HP COST):[ ](\d+)([%％])>/i;
  var noteSR1 = /<(?:(?:SR|STATE RESOURCE|STATE|RESOURCE) (\d+) COST):\s?(\d+)>/i;
  var noteSR2 = /<(?:(?:SR|STATE RESOURCE|STATE|RESOURCE) (\d+) COST):\s?(\d+)([%％])>/i;
  var note7a = /<(?:HIDE IF LEARNED SKILL):[ ]*(\d+(?:\s*,\s*\d+)*)>/i;
  var note7b = /<(?:HIDE IF LEARNED SKILL):[ ](\d+)[ ](?:THROUGH|to)[ ](\d+)>/i;
  var note8a = /<(?:HIDE IN BATTLE|hide during battle)>/i;
  var note8b = /<(?:HIDE IN FIELD|hide during field)>/i;
  var noteMpEval1 = /<(?:MP COST EVAL|custom mp cost)>/i;
  var noteMpEval2 = /<\/(?:MP COST EVAL|custom mp cost)>/i;
  var noteTpEval1 = /<(?:TP COST EVAL|custom tp cost)>/i;
  var noteTpEval2 = /<\/(?:TP COST EVAL|custom tp cost)>/i;
  var noteHpEval1 = /<(?:HP COST EVAL|custom hp cost)>/i;
  var noteHpEval2 = /<\/(?:HP COST EVAL|custom hp cost)>/i;
  //var noteSREval1 = /<(?:(?:SR|STATE RESOURCE|STATE|RESOURCE) (\d+) COST EVAL)>/i;
  //var noteSREval2 = /<\/(?:(?:SR|STATE RESOURCE|STATE|RESOURCE) (\d+) COST EVAL)>/i;
  var noteEvalReq1 = /<(?:EVAL REQUIREMENT|custom requirement)>/i;
  var noteEvalReq2 = /<\/(?:EVAL REQUIREMENT|custom requirement)>/i;
  var noteEvalExe1 = /<(?:EVAL EXECUTION|custom execution)>/i;
  var noteEvalExe2 = /<\/(?:EVAL EXECUTION|custom execution)>/i;
  var noteCostEval1 = /<(?:COST DISPLAY EVAL|display cost eval)>/i;
  var noteCostEval2 = /<\/(?:COST DISPLAY EVAL|display cost eval)>/i;
  var noteCostText1 = /<(?:CUSTOM COST DISPLAY|custom display cost)>/i;
  var noteCostText2 = /<\/(?:CUSTOM COST DISPLAY|custom display cost)>/i;
  var noteShowEval1 = /<(?:CUSTOM SHOW EVAL)>/i;
  var noteShowEval2 = /<\/(?:CUSTOM SHOW EVAL)>/i;
  for (var n = 1; n < group.length; n++) {
    var obj = group[n];
    var notedata = obj.note.split(/[\r\n]+/);

    obj.hpCost = 0;
    obj.hpCostPer = 0.0;
    obj.mpCostPer = 0.0;
    obj.tpCostPer = 0.0;
    obj.srCost = [];
    obj.srCostPer = [];
    obj.hideInBattle = false;
    obj.hideInField = false;
    obj.hideIfLearnedSkill = [];
    var evalMode = 'none';
    obj.hpCostEval = '';
    obj.mpCostEval = '';
    obj.tpCostEval = '';
    //obj.srCostEval = [];
    obj.requireEval = '';
    obj.executeEval = '';
    obj.costdisplayEval = '';
    obj.costShowEval = '';
    obj.customCostText = '';

    for (var i = 0; i < notedata.length; i++) {
      var line = notedata[i];
      if (line.match(note1)) {
        obj.mpCost = parseInt(RegExp.$1);
      } else if (line.match(note2)) {
        obj.mpCostPer = parseFloat(RegExp.$1 * 0.01);
      } else if (line.match(note3)) {
        obj.tpCost = parseInt(RegExp.$1);
      } else if (line.match(note4)) {
        obj.tpCostPer = parseFloat(RegExp.$1 * 0.01);
      } else if (line.match(note5)) {
        obj.hpCost = parseInt(RegExp.$1);
      } else if (line.match(note6)) {
        obj.hpCostPer = parseFloat(RegExp.$1 * 0.01);
	} else if (line.match(noteSR1)) {
        obj.srCost.push([parseInt(RegExp.$1), parseInt(RegExp.$2)]);
	} else if (line.match(noteSR2)) {
        obj.srCostPer.push([parseInt(RegExp.$1), parseFloat(RegExp.$2 * 0.01)]);
      } else if (line.match(note7a)) {
        var array = JSON.parse('[' + RegExp.$1.match(/\d+/g) + ']');
        obj.hideIfLearnedSkill = obj.hideIfLearnedSkill.concat(array);
      } else if (line.match(note7b)) {
        var array = JSON.parse('[' + RegExp.$1.match(/\d+/g) + ']');
        var range = Yanfly.Util.getRange(parseInt(RegExp.$1),
          parseInt(RegExp.$2));
        obj.hideIfLearnedSkill = obj.hideIfLearnedSkill.concat(range);
      } else if (line.match(note8a)) {
        obj.hideInBattle = true;
      } else if (line.match(note8b)) {
        obj.hideInField = true;
      } else if (line.match(noteMpEval1)) {
        evalMode = 'mp';
      } else if (line.match(noteMpEval2)) {
        evalMode = 'none';
      } else if (line.match(noteTpEval1)) {
        evalMode = 'tp';
      } else if (line.match(noteTpEval2)) {
        evalMode = 'none';
      } else if (line.match(noteHpEval1)) {
        evalMode = 'hp';
      } else if (line.match(noteHpEval2)) {
        evalMode = 'none';
	//  } else if (line.match(noteSREval1)) {
    //    evalMode = 'sr';
	//  } else if (line.match(noteSREval2)) {
    //    evalMode = 'none';
      } else if (line.match(noteEvalReq1)) {
        evalMode = 'custom requirement';
      } else if (line.match(noteEvalReq2)) {
        evalMode = 'none';
      } else if (line.match(noteEvalExe1)) {
        evalMode = 'custom execute';
      } else if (line.match(noteEvalExe2)) {
        evalMode = 'none';
      } else if (line.match(noteCostEval1)) {
        evalMode = 'display cost eval';
      } else if (line.match(noteCostEval2)) {
        evalMode = 'none';
      } else if (line.match(noteCostText1)) {
        evalMode = 'custom display cost';
      } else if (line.match(noteCostText2)) {
        evalMode = 'none';
      } else if (line.match(noteShowEval1)) {
        evalMode = 'custom show eval';
      } else if (line.match(noteShowEval2)) {
        evalMode = 'none';
      } else if (evalMode === 'mp') {
        obj.mpCostEval = obj.mpCostEval + line + '\n';
      } else if (evalMode === 'tp') {
        obj.tpCostEval = obj.tpCostEval + line + '\n';
      } else if (evalMode === 'hp') {
        obj.hpCostEval = obj.hpCostEval + line + '\n';
	//TODO: Get evals working for state resources; will probably need to be a [[1,"condition"],[2,"condition"]]-setup
	//  } else if (evalMode === 'sr') {
    //    obj.srCostEval = obj.srCostEval + line + '\n';
      } else if (evalMode === 'custom requirement') {
        obj.requireEval = obj.requireEval + line + '\n';
      } else if (evalMode === 'custom execute') {
        obj.executeEval = obj.executeEval + line + '\n';
      } else if (evalMode === 'display cost eval') {
        obj.costdisplayEval = obj.costdisplayEval + line + '\n';
      } else if (evalMode === 'custom display cost') {
        obj.customCostText = obj.customCostText + line;
      } else if (evalMode === 'custom show eval') {
        obj.costShowEval = obj.costShowEval + line + '\n';
      }
    }
  }
};

// STATE RESOURCE PAYMENT -----------------------------------------------------

Game_BattlerBase.prototype.skillSRCost = function(skill, resource) {
	var cost = 0;
	if (skill.srCost.length > 0)
		for (var src = 0; src < skill.srCost.length; src++)
			if (resource === skill.srCost[src][0]) cost += skill.srCost[src][1];
	var item = skill;
	var a = this;
	var user = this;
	var subject = this;
	var s = $gameSwitches._data;
	var v = $gameVariables._data;
	if (skill.srCostPer.length > 0)
		for (var srcp = 0; srcp < skill.srCostPer.length; srcp++)
			if (resource === skill.srCostPer[srcp][0])
				for (var r = 0; r < this.stateResources.length; r++)
					if (this.stateResources[r][0]===skill.srCostPer[srcp][0])
						cost += this.stateResources[r][2] * skill.srCostPer[srcp][1];
	return Math.max(0, Math.floor(cost));
};

NeMV.SR.Game_BattlerBase_canPaySkillCost = Game_BattlerBase.prototype.canPaySkillCost;
Game_BattlerBase.prototype.canPaySkillCost = function(skill) {
    if (!this.canPaySkillSRCost(skill)) return false;
    return NeMV.SR.Game_BattlerBase_canPaySkillCost.call(this, skill);
};

Game_BattlerBase.prototype.canPaySkillSRCost = function(skill) {
	if (this.stateResources === undefined) return;
	var cost = 0;
	var can = true;
	for (var r = 0; r < this.stateResources.length; r++) {
		var srid = this.stateResources[r][0];
		cost = this.skillSRCost(skill, srid);
		if (cost > 0) {
			can &= (this.isStateAffected(srid));
			can &= this.getSR(srid) >= cost;
		}
	}
    return can;
};

NeMV.SR.Game_BattlerBase_paySkillCost = Game_BattlerBase.prototype.paySkillCost;
Game_BattlerBase.prototype.paySkillCost = function(skill) {
    NeMV.SR.Game_BattlerBase_paySkillCost.call(this, skill);
    this.paySkillSRCost(skill);
};

Game_BattlerBase.prototype.paySkillSRCost = function(skill) {
	if (this.stateResources === undefined) return;
	var cost = 0;
	var ress = NeMV.SR.Resources;
	for (var r = 0; r < ress.length; r++) {
		cost = this.skillSRCost(skill, ress[r][0]);
		if (cost > 0) {
			var states = this.states();
			for (var s = 0; s < states.length; s++) {
				var state = states[s];
				if (state.id === ress[r][0])
					this.adjustSR(state.id, -cost);
			}
		}
	}
};

// STATE RESOURCE ACTOR DRAWING -----------------------------------------------

Window_Base.prototype.drawActorIconsTurns = function(actor, wx, wy, ww) {
    var iw = Window_Base._iconWidth;
    var icons = actor.allIcons().slice(0, Math.floor(ww / iw));
    var max = icons.length;
    var shownMax = Math.floor(ww / iw);
    for (var i = 0; i < actor.states().length; ++i) {
      if (shownMax <= 0) break;
      var state = actor.states()[i];
      if (state.iconIndex <= 0) continue;
      if (state.autoRemovalTiming > 0 ||
		  NeMV.SR.Resources.reduce(function(a,b){return a||b[0]===state.id;},false)) {
        this.drawStateTurns(actor, state, wx, wy);
      }
      wx += iw;
      --shownMax;
    }
    for (var b = 0; b < 8; ++b) {
      if (shownMax <= 0) break;
      if (actor._buffs[b] === 0) continue;
      this.drawBuffTurns(actor, b, wx, wy);
      wx += iw;
      --shownMax;
    }
    this.resetFontSettings();
    this.resetTextColor();
};

Window_Base.prototype.drawStateTurns = function(actor, state, wx, wy) {
	var isResource = NeMV.SR.Resources.reduce(function(a,b){return a||b[0]===state.id;},false);
    if (!state.showTurns && !isResource) return;
    var turns = isResource ? actor.getSR(state.id) : actor.stateTurns(state.id);
    if (!isResource && turns !== 0 && !turns) return;
    turns = Yanfly.Util.toGroup(Math.ceil(turns));
    wx += state.turnBufferX;
    wy += state.turnBufferY;
    this.changePaintOpacity(true);
    this.changeTextColor(this.textColor(state.turnColor));
    this.contents.fontSize = state.turnFontSize;
    this.drawText(isNaN(turns) ? 0 : turns, wx, wy, Window_Base._iconWidth, state.turnAlign);
    this.resetFontSettings();
    this.resetTextColor();
};

// SKILL COST DRAWING ---------------------------------------------------------

NeMV.SR.Window_SkillList_drawSkillCost = Window_SkillList.prototype.drawSkillCost;
Window_SkillList.prototype.drawSkillCost = function(skill, wx, wy, width) {
	var dw = NeMV.SR.Window_SkillList_drawSkillCost.call(this, skill, wx, wy, width);
    dw = this.drawSRCost(skill, wx, wy, dw);
    return dw;
};

Window_SkillList.prototype.drawSRCost = function(skill, wx, wy, dw) {
	for (var sr = 0; sr < this._actor.stateResources.length; sr++) {
		var srid = this._actor.stateResources[sr][0];
		var sricon = $dataStates[srid].iconIndex;
		var srtext = this._actor.stateResources[sr][3];
		if (this._actor.skillSRCost(skill, srid) > 0) {
		    if (sricon > 0) {
		      var iw = wx + dw - Window_Base._iconWidth;
		      this.drawIcon(sricon, iw, wy + 2);
		      dw -= Window_Base._iconWidth + 2;
		    }
		    var fmt = Yanfly.Param.SCCHpFormat;
		    var text = fmt.format(Yanfly.Util.toGroup(this._actor.skillSRCost(skill, srid)), srtext);
			this.contents.fontSize = Yanfly.Param.SCCHpFontSize;
		    this.drawText(text, wx, wy, dw, 'right');
		    var returnWidth = dw - this.textWidth(text) - Yanfly.Param.SCCCostPadding;
		    this.resetFontSettings();
		    dw += returnWidth;
		}
	}
	return dw;
};

// ACTOR SR PROTOS ------------------------------------------------------------

Game_BattlerBase.prototype.getMaxSR = function(resource) {
	return this.stateResources.reduce(function(a,b){return a>0?a:b[0]===resource?b[2]:0;},0);
};

Game_BattlerBase.prototype.setMaxSR = function(resource, amount) {
	for (var r = 0; r < this.stateResources.length; r++) {
		if (this.stateResources[r][0] === resource) {
			this.stateResources[r][2] = Math.max(amount, 0);
			return;
		}
	}
};

Game_BattlerBase.prototype.getSR= function(resource) {
	return this.stateResources.reduce(function(a,b){return a>0?a:b[0]===resource?b[1]:0;},0);
};

Game_BattlerBase.prototype.setSR= function(resource, amount) {
	for (var r = 0; r < this.stateResources.length; r++) {
		if (this.stateResources[r][0] === resource) {
			this.stateResources[r][1] = Math.min(Math.max(amount,0),this.getMaxSR(resource));
			return;
		}
	}
};

Game_BattlerBase.prototype.adjustSR= function(resource, amount) {
	for (var r = 0; r < this.stateResources.length; r++) {
		if (this.stateResources[r][0] === resource) {
			this.stateResources[r][1] = Math.min(Math.max(amount+this.getSR(resource),0),this.getMaxSR(resource));
			return;
		}
	}
};

// SETUP AND INITIALIZATION ---------------------------------------------------

NeMV.SR.Game_BattlerBase_initialize = Game_BattlerBase.prototype.initialize;
Game_BattlerBase.prototype.initialize = function() {
    NeMV.SR.Game_BattlerBase_initialize.call(this);
	if (this.stateResources === null || this.stateResources === undefined) {
		this.stateResources = [];
		for (var r = 0; r < NeMV.SR.Resources.length; r++) {
			this.stateResources.push(NeMV.SR.Resources[r]);
		}
	}
};

NeMV.SR.Game_BattlerBase_recoverAll = Game_BattlerBase.prototype.recoverAll;
Game_BattlerBase.prototype.recoverAll = function() {
    NeMV.SR.Game_BattlerBase_recoverAll.call(this);
	this.stateResources = [];
	for (var r = 0; r < NeMV.SR.Resources.length; r++) {
		this.stateResources.push(NeMV.SR.Resources[r]);
	}
};

NeMV.SR.Scene_Boot_terminate = Scene_Boot.prototype.terminate;
Scene_Boot.prototype.terminate = function() {
	NeMV.SR.Scene_Boot_terminate.call(this);
	NeMV.SR.init();
};