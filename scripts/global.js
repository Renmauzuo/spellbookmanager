var spellbooks;
var selectedSpellbook;

$(function () {
	//Setup spell list
	for (var i = 0; i < spellList.length; i++) {
		var spellLevel = i+1;
		$('<button class="button-toggle" data-level="'+spellLevel+'">Toggle Level '+spellLevel+' Spells</button>').data('target', '.spell-level-wrapper[data-level="'+spellLevel+'"]').appendTo('#spell-list');
		var levelWrapper = $('<div class="spell-level-wrapper" data-level="'+spellLevel+'"><div>');
		levelWrapper.appendTo('#spell-list');
		$('<h3></h3>').html('Level ' + spellLevel + ' Spells').appendTo(levelWrapper);
		for (var j = 0; j < spellList[i].length; j++) {
			levelWrapper.append('<input type="checkbox" name="'+spellList[i][j]+'">'+spellList[i][j]+'<br>');
		}
	}

	if (!localStorage['spellbooks']) {
		spellbooks = new Array();
		createNewSpellbook();
	} else {
		spellbooks = JSON.parse(localStorage['spellbooks']);
		selectSpellbook(0);
		updateSpellbookList();
	}

	$('#button-add-spellbook').on('click', function () {
		createNewSpellbook();
	});

	$('#button-export-all').on('click', function () {
		navigator.clipboard.writeText(localStorage['spellbooks']);
	});

	$('#button-export-current').on('click', function () {
		navigator.clipboard.writeText(JSON.stringify(spellbooks[selectedSpellbook]));
	});

	$('#button-delete').on('click', function () {
		spellbooks.splice(selectedSpellbook, 1);
		if (spellbooks.length) {
			selectSpellbook(0);
			saveSpellbooks();
			updateSpellbookList();
		} else {
			createNewSpellbook();
		}
	});

	$('#button-import').on('click', function () {
		var data = prompt("Please input the JSON for a spellbook or books:");
		if (data && data != "") {
			var imported = JSON.parse(data);
			if (Array.isArray(imported)) {
				spellbooks = spellbooks.concat(imported);
			} else {
				spellbooks.push(imported);
			}
			saveSpellbooks();
			updateSpellbookList();
		}

	});

	$('input[name="name"]').on('input', function () {
		spellbooks[selectedSpellbook].name = $(this).val();
		saveSpellbooks();
		updateSpellbookList();
	});

	$('input[name="cost"]').on('input', function () {
		spellbooks[selectedSpellbook].costModifier = $(this).val();
		saveSpellbooks();
	});

	$('input[name="time"]').on('input', function () {
		spellbooks[selectedSpellbook].timeModifier = $(this).val();
		saveSpellbooks();
	});

	$('input[name="fixedTime"]').on('input', function () {
		spellbooks[selectedSpellbook].fixedTime = $(this).val();
		saveSpellbooks();
	});

	$('input[name="maxLevel"]').on('input', function () {
		spellbooks[selectedSpellbook].maxLevel = $(this).val();
		saveSpellbooks();
		updateSpellList();
	});

	$('input[type="checkbox"]').on('input', function () {
		if ($(this).prop('checked')) {
			spellbooks[selectedSpellbook].spells.push($(this).attr('name'));
		} else {
			spellbooks[selectedSpellbook].spells.splice(spellbooks[selectedSpellbook].spells.indexOf($(this).attr('name')),1);
		}

		saveSpellbooks();
	});

	$('#spellbook-list').on('click', 'a', function () {
		selectSpellbook($(this).data('spellbook'));
	});

	$('button.button-toggle').on('click', function () {
		$($(this).data('target')).slideToggle();
	});


});

function createNewSpellbook() {
	var newSpellbook = {};
	newSpellbook.name = "New Spellbook";
	newSpellbook.costModifier = 1;
	newSpellbook.timeModifier = 1;
	newSpellbook.maxLevel = 9;
	newSpellbook.spells = [];
	spellbooks.push(newSpellbook);
	updateSpellbookList();
	saveSpellbooks();
	selectSpellbook(spellbooks.length-1);
}

function selectSpellbook(index) {
	selectedSpellbook = index;
	var newSpellbook = spellbooks[index];
	$('input[name="name"]').val(newSpellbook.name);
	$('input[name="cost"]').val(newSpellbook.costModifier);
	$('input[name="time"]').val(newSpellbook.timeModifier);
	$('input[name="fixedTime"]').val(newSpellbook.fixedTime);
	$('input[name="maxLevel"]').val(newSpellbook.maxLevel);
	updateSpellList();
}

function saveSpellbooks() {
	localStorage['spellbooks'] = JSON.stringify(spellbooks);
}

function updateSpellbookList() {
	$('#spellbook-list').empty();
	for (var i = 0; i < spellbooks.length; i++) {
		$('<a href="#" data-spellbook="'+i+'"></a>').html(spellbooks[i].name).appendTo('#spellbook-list');
	}
}

function updateSpellList() {
	var maxLevel = spellbooks[selectedSpellbook].maxLevel;
	$('[data-level]').each(function () {
		if ($(this).data('level') > maxLevel) {
			$(this).hide();
		} else {
			$(this).show();
		}
	});
	$('input[type="checkbox"]').prop('checked',false);
	for (var i = 0; i < spellbooks[selectedSpellbook].spells.length; i++) {
		var spellName = spellbooks[selectedSpellbook].spells[i];
		$('input[name="'+spellName+'"]').prop('checked',true);
	}

	//Any time the spell list is updated we can also update the comparison list
	$('#spellbook-comparison').empty();
	var spellsToCopy = [];
	var totalCost = 0;
	var totalTime = 0;
	for (var i = 0; i < spellbooks.length; i++) {
		//Skip current spellbook
		if (i == selectedSpellbook) {
			continue;
		}

		for (var j = 0; j < spellbooks[i].spells.length; j++) {
			var currentSpell = spellbooks[i].spells[j];
			if (!spellbooks[selectedSpellbook].spells.includes(currentSpell) && !spellsToCopy.includes(currentSpell)) {
				var spellLevel = $('[name="'+currentSpell+'"]').parent().data('level');
				if (spellLevel <= spellbooks[selectedSpellbook].maxLevel) {
					spellsToCopy.push(currentSpell);
					totalCost += 50 * spellLevel * spellbooks[selectedSpellbook].costModifier;
					if (spellbooks[selectedSpellbook].fixedTime) {
						totalTime += spellbooks[selectedSpellbook].fixedTime;
					} else {
						totalTime += 60 * spellLevel * spellbooks[selectedSpellbook].timeModifier;
					}
				}
			}
		}
	}

	$('<p>'+spellsToCopy.length+' spells can be copied from other spellbooks to this one. This will cost '+totalCost+'gp and take '+timeString(totalTime)+'.</p>').appendTo('#spellbook-comparison');
	var copyableSpellList = $('<ul></ul>');
	for (var i = 0; i < spellsToCopy.length; i++) {
		$('<li>'+spellsToCopy[i]+'</li>').appendTo(copyableSpellList);
	}
	copyableSpellList.appendTo('#spellbook-comparison');
}

function timeString(totalMinutes) {
	var hours = Math.floor(totalMinutes / 60);
	var minutes = totalMinutes % 60;
	var output = '';
	if (hours) {
		output += hours + ' hours';
		if (minutes) {
			output += ' and ';
		}
	}
	if (minutes) {
		output += minutes + ' minutes';
	}
	return output;
}