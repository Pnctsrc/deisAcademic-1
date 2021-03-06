Template.planTermRange.onCreated(function(){
	this.termRangeDict = new ReactiveDict();
    this.masterDict = this.data["dict"];
    this.termRangeDict.set("clickedOK", false);
    this.termRangeDict.set("allowed_new_terms", GlobalParameters.findOne().allowed_terms);//global parameter

    const term_list = Term.find().fetch().sort(function(a, b){
        return parseInt(a.id) - parseInt(b.id);
    });

    //never end with summer term
    let summer_term_obj;
    if(!!term_list[term_list.length - 1].name.match("Summer")){
        summer_term_obj = term_list[term_list.length - 1];
        term_list.splice(term_list.length - 1, 1);
    }

    for(let i = 0; i < Template.instance().termRangeDict.get("allowed_new_terms"); i++){
        const lasted_term = parseInt(term_list[term_list.length - 1].id);
        let new_term;
        if(("" + lasted_term).charAt(3) == 1){
            new_term = lasted_term + 2;//from spring to fall
        } else if(("" + lasted_term).charAt(3) == 3){
            new_term = lasted_term + 8;//from fall to spring
        }
        const year = 2000 + parseInt(("" + new_term).substring(0,3)) - 100;
        let season;
        if(("" + new_term).charAt(3) == 1){
            season = "Spring";
        } else if(("" + new_term).charAt(3) == 3) {
            season = "Fall";
        }
        const name = season + " " + year;

        const term_obj = {
            id: "" + new_term,
            name: name
        }
        term_list.push(term_obj);
    }

    if(summer_term_obj){
        term_list.push(summer_term_obj);
    }

    const result = term_list.sort(function(a, b){
        return parseInt(b.id) - parseInt(a.id);
    });
    this.termRangeDict.set("term_list", result);
})

Template.planTermRange.onRendered(function(){
	$('#search-select-start-semester').dropdown({
        match: "text"
    });
    $('#search-select-end-semester').dropdown({
        match: "text"
    });
	const start_semester = Template.instance().masterDict.get("planStartSemester");
    const end_semester = Template.instance().masterDict.get("planEndSemester");
	$(".js-start-semester").dropdown("set selected", start_semester)
	$(".js-end-semester").dropdown("set selected", end_semester)
})

Template.planTermRange.helpers({
	clickedOK: function() {
        const dict = Template.instance().masterDict;
        dict.set("pageName", "chooseCourse");
    },

    hasClickedOK: function() {
        return Template.instance().termRangeDict.get("clickedOK");
    },

    termList: function(){
        return Template.instance().termRangeDict.get("term_list")
    },
})

Template.planTermRange.events({
	"click .js-ok": function(event) {
        event.preventDefault();
        //get the sorted term list
        let termList = [];
        for(let term of Template.instance().termRangeDict.get("term_list")){
            const id = term.id
            termList.push(id);
        };
        termList = termList.sort(function(a, b){
            return parseInt(a) - parseInt(b);
        });
        const previous_start_term = Template.instance().masterDict.get("planStartSemester");
        const previous_end_term = Template.instance().masterDict.get("planEndSemester");
        //check if the semesters chosen are valid
        Template.instance().masterDict.set("planStartSemester", $(".js-start-semester input").val());
        Template.instance().masterDict.set("planEndSemester", $(".js-end-semester input").val());
        const start_semester = Template.instance().masterDict.get("planStartSemester");
        const end_semester = Template.instance().masterDict.get("planEndSemester");

        if(!start_semester){
            window.alert("Please enter the starting semester");
            return;
        }

        if(!end_semester){
            window.alert("Please enter the ending semester");
            return;
        }

        if($.inArray(end_semester, termList) - $.inArray(start_semester, termList) < 0){
            window.alert("Please make sure that the semester range is correct");
            return;
        } else if ($.inArray(end_semester, termList) - $.inArray(start_semester, termList) == 0){
            window.alert("Please choose two different semesters");
            return;
        } else if ($.inArray(end_semester, termList) - $.inArray(start_semester, termList) > 11){
            window.alert("Please choose a smaller range");
            return;
        }

        if(previous_start_term !== start_semester || previous_end_term !== end_semester){
            Template.instance().masterDict.set("fetched_planSearchData");
        }

        $(".js-majorGo").attr("class", "ui loading disabled button js-ok");

        const chosenTerm = Template.instance().masterDict.get("chosenTerm");
        if(chosenTerm < start_semester || chosenTerm > end_semester){
            Template.instance().masterDict.set("chosenTerm", start_semester);
        };

        const scheduleList = Template.instance().masterDict.get("scheduleList");
        for(let term in scheduleList){
            if(term < start_semester || term > end_semester){
                delete scheduleList[term];
            }
        };
        Template.instance().masterDict.set("scheduleList", scheduleList);

        if(previous_start_term !== start_semester || previous_end_term !== end_semester){
            Template.instance().masterDict.set("already_fetched_list", []);
            Template.instance().masterDict.set("already_fetched_wishlist", []);
            Template.instance().masterDict.set("hasCourseList", false);
            Template.instance().masterDict.set("includeWishlist", false);
        }

        Template.instance().termRangeDict.set("clickedOK", true);
    },
})