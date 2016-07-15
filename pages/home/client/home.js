//Global reactive-dict
homeDict = new ReactiveDict();
homeDict.set('showTable', false);
homeDict.set('majorDetail', []);
homeDict.set('sectionDetail', []);
homeDict.set('courseData');

Template.home.onRendered(function(){
	$('#multi-select').dropdown();
	$('#search-select').dropdown();
	$('#search-select-start-time').dropdown();
	$('#search-select-end-time').dropdown();
	$('#multi-select-days').dropdown();
	Meteor.call("getProfData", function(err, result){
		$('#prof-search').search({
    		source : result,
    		searchFields   : [
      			'title'
    		],
  		});
	})
})

Template.home.helpers ({
	showTable: function(){
		return homeDict.get('showTable');
	},
})

Template.home.events ({
  	"submit #search_main": function(event, template) {
    	event.preventDefault();
    	homeDict.set('showTable', false);
    	homeDict.set('majorDetail', []);
		homeDict.set('sectionDetail', []);
		homeDict.set('courseData');
		homeDict.set('termName');
		homeDict.set('noResult', false);

		const keyword = $(".js-submit-search").val();
		const term = $(".js-term").val();
		const req_array = $(".js-req .ui.label.transition.visible").toArray();
		const req_names_array = [];
		for(let item of req_array){
			req_names_array.push(item.innerText);
		};
		const days_array = $(".js-days .ui.label.transition.visible").toArray();
		const days_names_array = [];
		for(let item of days_array){
			days_names_array.push($(item).attr("data-value"));
		};
		const start_time = $(".js-start-time input").val();
		const end_time = $(".js-end-time input").val();
		const time_and_date = {
			days: days_names_array,
			start: start_time,
			end: end_time
		};
		const dept = $("#search-select input").val();//""for no option and "all" for all departments
		const instructor = $(".js-prof input").val();

		Meteor.call("searchCourse", keyword, term, req_names_array, dept, instructor, time_and_date,
			function(err, result){
				if(result.length == 0){
					homeDict.set('noResult', true);
				} else {
					homeDict.set('courseData', result);
					homeDict.set('noResult',false);
				}

    			homeDict.set('showTable', true);
			}
		);
  	},

  	"change .js-term": function(event, template){
 		event.preventDefault();
    	homeDict.set('showTable', false);
    	homeDict.set('majorDetail', []);
		homeDict.set('sectionDetail', []);
		homeDict.set('courseData');
		homeDict.set('termName');
		homeDict.set('noResult', false);

		const keyword = $(".js-submit-search").val();
		const term = $(".js-term").val();
		const req_array = $(".js-req .ui.label.transition.visible").toArray();
		const req_names_array = [];
		for(let item of req_array){
			req_names_array.push(item.innerText);
		};
		const days_array = $(".js-days .ui.label.transition.visible").toArray();
		const days_names_array = [];
		for(let item of days_array){
			days_names_array.push($(item).attr("data-value"));
		};
		const start_time = $(".js-start-time input").val();
		const end_time = $(".js-end-time input").val();
		const time_and_date = {
			days: days_names_array,
			start: start_time,
			end: end_time
		};
		const dept = $("#search-select input").val();
		const instructor = $(".js-prof input").val();

		Meteor.call("searchCourse", keyword, term, req_names_array, dept, instructor, time_and_date,
			function(err, result){
				if(result.length == 0){
					homeDict.set('noResult', true);
				} else {
					homeDict.set('courseData', result);
					homeDict.set('noResult',false);
				}

    			homeDict.set('showTable', true);
			}
		);
 	},
})

Template.search_result.helpers({
	detailReady: function(){
		return homeDict.get('courseInfo') != null;
	},

	courseDataReady: function(){
		return homeDict.get('courseData') != null;
	},

	courseData: function(){
		return homeDict.get('courseData');
	},

	courseInfo: function(){
		return homeDict.get('courseInfo');
	},

	majorInfo: function(){
		return homeDict.get('majorDetail');
	},

	sectionData: function(){
		return homeDict.get('sectionDetail');
	},

	noResult: function(){
		return homeDict.get('noResult');
	},

	settings_course: function(){
		return {
			rowsPerPage: 10,
			showFilter: false,
			showNavigationRowsPerPage: false,
			fields:[
				{key:'name', label: 'Course'},
				{key:'code', label:'Code'},
				{key:'requirements', label:'Requirements'},
				{key:'description', label:'Description', tmpl:Template.description_detail},
				{key:'term', label:'Term', fn: function(key, object){
					Meteor.call("searchTerm", key, function(err, result){
						homeDict.set("termName" + object.id, result);
					});

					const term_name = homeDict.get("termName" + object.id);
					if(!term_name){
						return new Spacebars.SafeString("<div class=\"ui active inline loader\"></div>");
					} else {
						return term_name;
					}
				}},
			],
		};
	},
})

Template.search_result.onRendered(function(){
	$('#popup-tab .item').tab();
})

Template.search_result.events({
	"click .reactive-table tbody tr": function(event){
		homeDict.set('courseInfo');
		homeDict.set('sectionDetail', []);
		homeDict.set('majorDetail', []);
		homeDict.set('instructors');
		homeDict.set('courseInfo', this);
		let popup = $(".popup");
		popup.css("top", (($(window).height() - popup.outerHeight()) / 2) + $(window).scrollTop() + 30 + "px");  
		$(".overlay, .popup").fadeToggle();

		if(!homeDict.get('courseInfo')){//continue only if the data is ready
			return;
		};

		//get major details	
		Meteor.call("getMajorDetails", homeDict.get('courseInfo'), 
			function(err, result){
				homeDict.set('majorDetail', result);
			}
		);

		//get section details
		Meteor.call("getSectionDetails", homeDict.get('courseInfo'), 
			function(err, result){
				homeDict.set('sectionDetail', result);
			}
		);	
	},

	"click .overlay,.js-close-popup" :function(event){
		$(".overlay, .popup").fadeToggle();
	},
})

Template.description_detail.onRendered(function(){
	$('.ui.accordion').accordion();
})

Template.description_detail.helpers({
	showDescription: function(text){
		if (text.length > 50){
			return text.substring(0, 50) + "...";
		} else {
			return text;
		};
	},
})

Template.search_result_time_table.helpers({
	sectionData: function(){
		return homeDict.get('sectionDetail');
	},

	settings_result: function(){
		return {
			rowsPerPage: 5,
			showFilter: false,
			showNavigationRowsPerPage: false,
			fields:[
				{key:'section', label: 'Section', fn: function(key){
					var section = key;
					if(section < 10){
						section = "0" + section;
					};

					return "Section " + section;
				}},
				{key:'enrolled', label:'Enrolled', fn: function(key, object){
					var limit = object.limit;
					if(!limit){
						limit = 999;
					};

					return key + "/" + limit;
				}},
				{key:'status_text', label:'Status'},
				{key:'times', label:'Times', fn:function(key){
					var result = "";
					for(var item of key){
						//get days
						days = "";
						for(var day of item.days){
							days = days + day + " ";
						}

						//get times
						const start = item.start;
						const end = item.end;
						var start_min = Math.floor(start % 60);
						if(start_min < 10){
							start_min = "0" + start_min;
						}

						var end_min = Math.floor(end % 60);
						if(end_min < 10){
							end_min = "0" + end_min;
						}

						var start = Math.floor(start / 60) + ":" + start_min;
						var end = Math.floor(end / 60) + ":" + end_min;
						const time = start + "-" + end;

						result = result + days + ": " + time + "<br>";
					};

					if(result){
						return new Spacebars.SafeString(result);
					} else {
						return "TBA";
					};
				}},
				{key:'instructors', label:'Instructor', fn: function(key, object){
					Meteor.call("searchInstructorArray", key, function(err, result){
						homeDict.set("instructors" + object.id, result);
					});

					const instructors = homeDict.get("instructors" + object.id);
					if(!instructors){
						return new Spacebars.SafeString("<div class=\"ui active inline loader\"></div>");
					} else {
						return new Spacebars.SafeString(instructors);
					};
				}},
			],
		};
	},
})