Template.masterMajorPlan.onCreated(function(){
	this.masterPageDict = new ReactiveDict();

	if(this.data){
		const data = this.data["plan_obj"];

		if(!data){
	   		window.alert("No such plan.");
	    	Router.go('/');
	    	return;
		}

		const chosenCourse = data.chosenCourse;
		const chosenMajor = data.majorId;
		this.masterPageDict.set("chosenCourse", chosenCourse);
		this.masterPageDict.set("chosenMajor", chosenMajor);
		this.masterPageDict.set("courseList", chosenCourse);
		
		this.masterPageDict.set("planStartSemester", data.start_term);
	    this.masterPageDict.set("planEndSemester", data.end_term);
	    this.masterPageDict.set("isModify", true);


	    const current_plan_id = Router.current().params._id;
        const scheduleList = MajorPlansPnc.findOne(current_plan_id).scheduleList;
        const masterDict = this.masterPageDict;
        let hasUnavailable = false;
        
        Meteor.call("fetchScheduleList", scheduleList, function(err, response) {
            if (err) {
                window.alert(err.message);
                return;
            };

            const result = response.data;
            const fetched_scheduleList = {};
            if(response.msg["unavailable"].length != 0) {
                hasUnavailable = true;
                masterDict.set("unavailableSections", response.msg["unavailable"]);
            }

            for (let term in result) { //go through each term in the result
                const courseList = [];
                const term = term;
                for (let section in result[term]) {
                    const result_obj = result[term][section];
                    const section_obj = result_obj.object;
                    const chosen = result_obj.chosen;
                    const course_code = result_obj.courseCode;
                    const events_array = [];
                    for (let time of section_obj.times) {
                        for (let day of time.days) {
                            //turn time from minuets form into a real time form (HH:MM:SS)
                            function convertTime(time) {
                                var min = Math.floor(time % 60);
                                if (min < 10) {
                                    min = "0" + min;
                                }

                                var hr = Math.floor(time / 60);
                                if (hr < 10) {
                                    hr = "0" + hr;
                                }

                                var time = hr + ":" + min + ":00";
                                return time;
                            };

                            //turns day names into date
                            function dayNum(day) {
                                if (day === "m") {
                                    return "03";
                                } else if (day === "tu") {
                                    return "04";
                                } else if (day === "w") {
                                    return "05";
                                } else if (day === "th") {
                                    return "06";
                                } else if (day === "f") {
                                    return "07";
                                }
                            };
                            let event_obj;
                            if($.inArray(section, response.msg["unavailable"]) != -1){
                                event_obj = {
                                    id: section, //this holds the section id so events at different tiems are associated
                                    title: course_code,
                                    color:"#FF4500",//orange
                                    start: "2000-01-" + dayNum(day) + "T" + convertTime(time.start) + "-05:00",
                                    end: "2000-01-" + dayNum(day) + "T" + convertTime(time.end) + "-05:00",
                                    section_obj: section_obj //this hold the actual section object for later use
                                };
                            } else {
                                event_obj = {
                                    id: section, //this holds the section id so events at different tiems are associated
                                    title: course_code,
                                    start: "2000-01-" + dayNum(day) + "T" + convertTime(time.start) + "-05:00",
                                    end: "2000-01-" + dayNum(day) + "T" + convertTime(time.end) + "-05:00",
                                    section_obj: section_obj //this hold the actual section object for later use
                                };
                            }

                            events_array.push(event_obj);
                        }
                    }

                    const source = {
                        chosen: chosen,
                        id: section,
                        events: events_array
                    }

                    courseList.push(source);
                }

                fetched_scheduleList[term] = {
                    term: term,
                    courseList: courseList
                }
            }

            
            const futureList = MajorPlansPnc.findOne(current_plan_id).futureList;
            const wishlist_course = [];
            for(let future_schedule of futureList){
            	const course_cont_list = future_schedule.courseList;

                fetched_scheduleList[future_schedule.term] = {
            		term: future_schedule.term,
            		courseList: course_cont_list
            	}

                for(let continuity_id of course_cont_list){
                    if($.inArray(continuity_id, chosenCourse) == -1){
                        if($.inArray(continuity_id, wishlist_course) == -1){
                            wishlist_course.push(continuity_id);
                        }
                    }
                }
            }

            Meteor.call("fetchContList", wishlist_course, function(err, result){
                if(err){
                    window.alert(err.message);
                    return;
                }

                const fetch_wishlist_course = {};
                for(let info_obj of result){
                    fetch_wishlist_course[info_obj.continuity_id] = info_obj;
                }
                masterDict.set("scheduleList", fetched_scheduleList);
                masterDict.set("courseFetchInfo", fetch_wishlist_course);
                masterDict.set("pageName", "makeSchedule");
                if(hasUnavailable){
                    window.alert("Unfortunately, some of your sections are no longer available");
                }
            })
        });
	} else {
		this.masterPageDict.set("pageName", "typeMajor");
	}
})

Template.masterMajorPlan.helpers({
	"typeMajor": function(){
		return Template.instance().masterPageDict.get("pageName") === "typeMajor";
	},

	"helpChooseMajor": function(){
		return Template.instance().masterPageDict.get("pageName") === "helpChooseMajor";
	},

	"chooseCourse": function(){
		return Template.instance().masterPageDict.get("pageName") === "chooseCourse";
	},

	"makeSchedule": function(){
		return Template.instance().masterPageDict.get("pageName") === "makeSchedule";
	},

	"changeTerm": function(){
		return Template.instance().masterPageDict.get("pageName") === "changeTerm";
	},

	masterDict: function(){
		return Template.instance().masterPageDict
	},
})
