/* Copyright 2012 Vladimir Prus <vladimir.prus@gmail.com>

   This work is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License. 
   To view a copy of this license, visit http://creativecommons.org/licenses/by-nc-sa/3.0/ or send a letter 
   to Creative Commons, 444 Castro Street, Suite 900, Mountain View, California, 94041, USA.
*/

var having_fun = false;
var funStart = null;
var backdrop = null;
var originalMinutesForFun = null;

var dayStart = "7:00";
var dayEnd = "23:00";

var date = new Date();
var d = date.getDate();
var m = date.getMonth();
var y = date.getFullYear();

var events = [];


function haveLocalStorage() {
    try {
	return 'localStorage' in window && window['localStorage'] !== null;
    } catch(e){
	return false;
    }
}

function loadSettings() {

    if (!haveLocalStorage())
	return;

    var s = localStorage['dayStart'];
    if (s != undefined && s != '')
	dayStart = s;

    s = localStorage['dayEnd'];
    if (s != undefined && s != '')
	dayEnd = s;

    $("#waketime-setting").val(dayStart);
    $("#bedtime-setting").val(dayEnd);
}

function saveSettings() {

    if (!haveLocalStorage())
	return;

    localStorage['dayStart'] = dayStart;
    localStorage['dayEnd'] = dayEnd;
}

function saveEvents() {

    if (!haveLocalStorage())
	return;
	
//    localStorage['events'] = JSON.stringify(events);
}

function loadEvents() {
    
    if (!haveLocalStorage())
	return;

//    s = localStorage["events"];

//    if (s != undefined && s != '')
//	events = JSON.parse(s);
}

function validateInputElement($element, fn, variableName) {

    var newValue;
    var newValueString = $element.val();
    var valid = true;

    try {
	newValue = fn(newValueString);
    } catch(e) {
	valid = false;
    }

    if (valid && newValue == undefined) {
	valid = false;
    }

    if (valid) {
	window[variableName] = newValueString;
	$element.parent().parent().removeClass("error");
    } else {
	$element.parent().parent().addClass("error");
    }

    return valid;
}

var editedEvent = null;


function calendarEventClick(calendarEvent, jsEvent, view) {

    editedEvent = calendarEvent;

    $('#event-editor-name').text(calendarEvent.title);
    $('#event-editor-category a[data-category-name="@"]'.replace('@', calendarEvent.category)).tab('show');
    $('#event-editor-times').text($.fullCalendar.formatDate(calendarEvent.start, "dddd MMM d, HH:mm") + " - " + $.fullCalendar.formatDate(calendarEvent.end, "HH:mm"));

    $('#event-editor').modal();

}

function eventEditorDelete() {
    $("#calendar-day").fullCalendar('removeEvents', editedEvent.id);
    updateTime();
}

function eventEditorSave() {

    editedEvent.category = $("#event-editor-category li[class='active'] a").attr('data-category-name');
    editedEvent.color = eventColor(editedEvent);
    $("#calendar-day").fullCalendar('updateEvent', editedEvent);
    $("#calendar").fullCalendar('updateEvent', editedEvent);

    $("#event-editor").modal('hide');
    updateTime();
}

var createdEvent = null;

function calendarRenderCallback(event, element, view)
{
}

var nextEventId = 1;

function eventColor(calendarEvent)
{
    if (calendarEvent.category == "Fitness") {
	return "#800000";
    } else if (calendarEvent.category == "Study") {
	return "#B52CDB";
    } else if (calendarEvent.category == "Errands") {
	return "#008000";
    }

    return "#36c";
}

function createEvent(event)
{
    $title = $("#event-create-title");
    $titleGroup = $title.parent().parent();

    createdEvent.title = $title.val();

    if (createdEvent.title == "") {
	$titleGroup.addClass("error");
	$title.focus();
	event.preventDefault();
	return;
    } else {
	$titleGroup.removeClass("error");
    }

    createdEvent.category = $("#event-create-category li[class='active'] a").attr('data-category-name');
    createdEvent.id = nextEventId++;

    createdEvent.color = eventColor(createdEvent);
    console.log("Category = " + createdEvent.category);

    $("#calendar-day").fullCalendar('renderEvent', createdEvent);
    $("#calendar").fullCalendar('renderEvent', createdEvent);
    events.push(createdEvent);

    

    $("#event-creator").modal('hide');
    updateTime();
}

function calendarSelection(calendar, start, end, allDay) {

    createdEvent = {start: start, end: end, allDay: allDay};
    $('#event-create-title').val("");
    $("#event-create-title").parent().parent().removeClass("error");
    $("#event-creator").modal('show');
    $("#event-create-title").focus();
    calendar.fullCalendar('unselect');
}


function setupDayCalendar() {

    // Seems a bit inefficient to rebuild entire calendar, but
    // were not able to find better way.
    // Maybe, using 'view', setting visMin, and then calling render should
    // work, dunno.
    var $c = $('#calendar-day');
    $c.empty();
    $c.fullCalendar({
	editable: true,
	allDaySlot: false,
	defaultView: 'agendaDay',
	firstDay: 1,
	events: events,
	minTime: dayStart,
        maxTime: dayEnd,
	eventClick: calendarEventClick,
	selectable: true,
	selectHelper: true,
	select: function(s, e, a) { calendarSelection($c, s, e, a); },
	eventDrop: updateTime,
	eventResize: updateTime
    });
    $("#calendar-day td[class='fc-header-right']").css("display", "none");
}

function setupWeekCalendar() {

    var $c = $("#calendar");
    $c.fullCalendar({
	editable: true,
	defaultView: 'agendaWeek',
	allDaySlot: false,
	firstDay: 1,
	events: events,
	minTime: dayStart,
        maxTime: dayEnd,
	eventClick: calendarEventClick,
	selectable: true,
	selectHelper: true,
	select: function(s, e, a) { calendarSelection($c, s, e, a); },
	eventDrop: updateTime,
	eventResize: updateTime
    });
}

function applySettings() {

    setupDayCalendar();
    updateTime();

}

function formatTime(number)
{
    s = Math.floor(number).toPrecision(2);
    i = s.indexOf('.')
    if (i != -1) {
	s = s.substr(0, i);
    }
    return s;
}

function pad(string)
{
    if (string.length == 1)
	return '0' + string;
    return string;    
}

function splitRange(range, event)
{
    if (event[0] <= range[0] && event[1] >= range[1]) {
	return [];
    } else if (event[1] < range[0] || event[0] >= range[1]) {
	return [range];
    } else {
	var result = [];

	if (event[0] > range[0]) {
	    result.push([range[0], event[0]]);
	}
	if (event[1] < range[1]) {
	    result.push([event[1], range[1]]);
	}
	return result;
    }
}

function minutesForFun() {
    $c = $("#calendar-day");

    view = $c.fullCalendar('getView')

    nowDate = new Date()
    startDate = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate(), 0, 0);

    nowMinutes = (nowDate - startDate)/1000/60;

    calStart = $.fullCalendar.parseTime(dayStart);
    calEnd = $.fullCalendar.parseTime(dayEnd);

    if (nowMinutes < calStart || nowMinutes >= calEnd)
    {
	$("#time").text("Sweet dreams!");
	$("#have-fun-button").hide();
	$("#have-fun-subtext").text("(see settings)");
	return;
    }

    function toMinutes(date) {
	return (date-startDate)/1000/60;
    }

    var clientEvents = $c.fullCalendar('clientEvents');
   
    ranges = [[nowMinutes, calEnd]]

    // Iterate over all calendar events, cutting away ranges that are now busy

    clientEvents.forEach(function(e) {

	var newRanges = []
	ranges.forEach(function(r) {
	    newRanges = newRanges.concat(splitRange(r, [toMinutes(e.start), toMinutes(e.end)]));
	});
	ranges = newRanges
    });

    // Sum up time that remains
   
    minutes = 0;
    for (i = 0; i < ranges.length; ++i) {
	minutes += ranges[i][1] - ranges[i][0];
    }
    return minutes;
}

function updateTime() {

    var minutes;

    if (having_fun) {

	minutes = originalMinutesForFun - Math.floor((new Date() - startFun)/1000/60);
	if (minutes < 0)	    
	    minutes = 0;

	console.log("Minutes remaining " + minutes + " original " + originalMinutesForFun);

    } else {

	minutes = minutesForFun()
    }

    if (minutes == undefined)
	return;

    function formatMinutes(m) {
	return formatTime(m/60) + ':' + pad(formatTime(m%60))
    }

    $("#time").text(formatMinutes(minutes));
    $hfb = $("#have-fun-button");
    $hfb.show();
    if (minutes == 0) {
	$hfb.attr("disabled", "true");
	$('#time').addClass("out-of-time");
	$('#time').removeClass("almost-out-of-time");
    } else {
	$hfb.removeAttr("disabled");
	$('#time').removeClass("out-of-time");
	if (minutes < 60) {
	    $('#time').addClass("almost-out-of-time");
	} else {
	    $('#time').removeClass("almost-out-of-time");
	}
    }

    if (having_fun) {
	$("#have-fun-subtext").text("remains");
    } else {
	$("#have-fun-subtext").text("for fun");
    }

    var totals = {"Work": 0, "Study": 0, "Fitness": 0, "Errands": 0};
    
    var clientEvents = $c.fullCalendar('clientEvents');
    clientEvents.forEach(function (e) {

	if (e.category == "Fun") { return; }
	
	totals[e.category] += Math.floor(e.end.getTime() - e.start.getTime())/1000/60;

    });

    $("#work-total").text(formatMinutes(totals["Work"]));
    $("#study-total").text(formatMinutes(totals["Study"]));
    $("#fitness-total").text(formatMinutes(totals["Fitness"]));
    $("#errands-total").text(formatMinutes(totals["Errands"]));

}

function showTopMessage(text) {
    
    var m = $("#top-message");
    m.text(text)
    m.show();
    m.css('margin-left', -m.width()/2);
    setTimeout(function() { $("#top-message").fadeOut(); }, 2000);
}

function moveEvent(event, newStartTime)
{
    var delta = newStartTime.getTime() - event.start.getTime()
    event.start = new Date(event.start.getTime() + delta);
    event.end = new Date(event.end.getTime() + delta);
}

function rescheduleNonfunEvents(funEvent)
{
    var newEvents = []

    events.forEach(function(e) {

	if (e.category == "Fun") {
	    newEvents.push(e);
	    return;
	}

	
	if (e.end <= funEvent.start) {
	    // Ended before fun stated, nothing to do.
	    newEvents.push(e);
	} else if (e.start >= funEvent.end) {
	    // starts later, don't touch. We might want to reschedule these as
	    // well, but it's starting to be complicated.
	    newEvents.push(e);
	} else {
	    // partial or complete overlap.
	    
	    if (funEvent.start > e.start) {
		// We did some initial part of the event
		var newEvent = {
		    title: e.title,
		    start: e.start, 
		    end: e.end, 
		    allDay: false,
		    color: e.color,		
		    category: e.category,
		    id: nextEventId++
		};

		newEvent.end = funEvent.start;
		newEvents.push(newEvent);

		$("#calendar-day").fullCalendar('renderEvent', newEvent);
		$("#calendar").fullCalendar('renderEvent', newEvent);
		
		// Create the overlapping portion.
		e.start = funEvent.start;
		moveEvent(e, funEvent.end);
		newEvents.push(e);
		$("#calendar-day").fullCalendar('updateEvent', e);
		$("#calendar").fullCalendar('updateEvent', e);

	    } else {
		// Start of event is already inside fun event. Move it all
		moveEvent(e, funEvent.end);
		newEvents.push(e);
		$("#calendar-day").fullCalendar('updateEvent', e);
		$("#calendar").fullCalendar('updateEvent', e);
	    }
	}
    });

//    The below does not work. Seems I don't get the data model of FullCalendar.
//    events = newEvents;
//    $('#calendar-day').fullCalendar('refetchEvents');
//    $('#calendar-day').fullCalendar('render');
//    $('#calendar').fullCalendar('render');
}

$(function() {

    loadSettings();
    loadEvents();
    
    if (haveLocalStorage() && localStorage["welcome-screen-shown"] == "true") {
	$("#welcome").css("display", "none");
    }
           
    $( "#welcome-ok" ).click(function() {
	$( "#welcome" ).hide("explode");
	if (haveLocalStorage()) {
	    localStorage["welcome-screen-shown"] = true;
	}
	return false;
    });
    
    $( "#have-fun-button" ).click(function() {

	updateTime();
	
        var sidebar = $("#have-fun-sidebar");
	
	if (! having_fun ) {
	    this.firstChild.nodeValue = "Back to work";
	    $(this).removeClass("btn-primary");
	    backdrop = $("<div class='modal-backdrop'/>").appendTo(document.body);
	    sidebar.addClass("modal2")
	                    sidebar.addClass("prominent");
	    originalMinutesForFun = minutesForFun();
	    startFun = new Date();
	    
	    funEvent = {
		title: "Fun",
		start: startFun, 
		end: new Date(startFun.getTime() + 30*60000), 
		allDay: false,
		color: "#97A8A8",		
		category: "Fun",
		id: nextEventId++
	     };
	    events.push(funEvent);
	    $("#calendar-day").fullCalendar('renderEvent', funEvent);
	    $("#calendar").fullCalendar('renderEvent', funEvent);
            having_fun = true;
	    	   
        } else {
	    this.firstChild.nodeValue = "Enjoy now";
	    $(this).addClass("btn-primary");
	    backdrop.remove();
            sidebar.removeClass("modal2");
            sidebar.removeClass("prominent");
	    $("#time").popover("hide");
            having_fun = false;

	    funEvent.end = new Date();
	    if (funEvent.end - funEvent.start < 10*60*1000) {
		showTopMessage("You had less that 10 minutes of fun. Will not clutter your calendar with that.");
		setTimeout(function() {
		    $("#calendar-day").fullCalendar('removeEvents', funEvent.id);
		}, 2000);
	    } else {
		$("#calendar-day").fullCalendar('updateEvent', funEvent);
		$("#calendar").fullCalendar('updateEvent', funEvent);

		rescheduleNonfunEvents(funEvent);
		showTopMessage("Your non-fun events were rescheduled.");
		updateTime();
	    }
        }			
    });
    
    if (!haveLocalStorage()) {
	$("#no-local-storage").show();
    }
    
    $( "#settings-save").click(function(event) {

	var newDayStart;
	var newDayEnd;
	var valid = true;

	valid &= validateInputElement($("#waketime-setting"), $.fullCalendar.parseTime, "dayStart");
	valid &= validateInputElement($("#bedtime-setting"), $.fullCalendar.parseTime, "dayEnd");

	event.preventDefault();
        	
	if (valid) {
	    saveSettings();
	    $("#navbar a[href='#day']").tab('show');
	    applySettings();
	    showTopMessage("The settings were saved.");
	    updateTime();
	}
    });
    
    $( "#settings-cancel").click(function() { 
	$("#navbar a[href='#day']").tab('show');
    });    
});

$(document).ready(function() {
    
    setupDayCalendar();
    setupWeekCalendar();
        
    $('#day-link').on('shown', function (e) {
	$('#calendar-day').fullCalendar('render');
    });
    
    $('#week-link').on('shown', function (e) {
	$('#calendar').fullCalendar('render');
    });

    $('#email-disabled').popover({
	title: "Why is this disabled?",
	content: "It would be great to test with real calendar data. But it's hard to implement, and nobody would trust me enough anyway. So, all events will live in a browser only.",
    });
    $("#email-disabled").click(function (e) {
	e.preventDefault();
    });

    $('.commute-disabled').popover({
	title: "Why is this disabled?",
	content: "Determining your commute time would require complicated integration with Google Maps. For user testing, we'll either create events for commute by hand, or ignore this as not essential."
    });
    $(".commute-disabled").click(function (e) {
	e.preventDefault();
    });

    $("#event-create").click(createEvent);

    $("#event-editor-save").click(eventEditorSave);
    $("#event-editor-delete").click(eventEditorDelete);

    $('#waketime-setting').timePicker();
    $('#bedtime-setting').timePicker();

    updateTime();

    setInterval(updateTime, 1000);
});
