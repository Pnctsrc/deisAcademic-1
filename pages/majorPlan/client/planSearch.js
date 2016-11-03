Template.planSearch.helpers({
    showTable: function(planDict) {
        return Template.instance().planSearchDict.get('showTable');
    },

    planSearchDict: function(){
        return Template.instance().planSearchDict;
    },

    hasClickedNext: function(){
        return Template.instance().planSearchDict.get('clickedNext');
    },

    clickedNext: function(dict){
        dict.set("pageName", 'makeSchedule');
    },

    hasClickedTerm: function(){
        return Template.instance().planSearchDict.get('clickedTerm');
    },

    clickedTerm: function(dict){
        dict.set("pageName", 'changeTerm');
    },

    setMasterDict: function(dict){
        Template.instance().masterDict = dict;
        Template.instance().planSearchDict = dict;
        Template.instance().planSearchDict.set('majorId', dict.get('chosenMajor'));
        Template.instance().planSearchDict.set('showTable', false);
        Template.instance().planSearchDict.set('majorDetail', []);
        Template.instance().planSearchDict.set('sectionDetail', []);
        Template.instance().planSearchDict.set('sectionIndex', 0);
        Template.instance().planSearchDict.set('courseData');
        Template.instance().planSearchDict.set('clickedNext', false);
        Template.instance().planSearchDict.set('clickedTerm', false);
    },

    hasMajor: function(){
        return !!Template.instance().planSearchDict.get('majorId');
    },

    getData: function(){
        const planDict = Template.instance().planSearchDict;
        planDict.set('showTable', false);
        planDict.set('majorDetail', []);
        planDict.set('sectionDetail', []);
        planDict.set('courseData');
        planDict.set('termName');
        planDict.set('noResult', false);

        const dept = planDict.get('majorId'); //""for no option and "all" for all departments

        Meteor.call("searchPnc", "", "", [], dept, "", {
            days: [],
            start: "",
            end: ""
        }, false, false,
            function(err, result) {
                if(err){
                    window.alert(err.message);
                    return;
                }

                if (result.length == 0) {
                    planDict.set('noResult', true);
                } else {
                    const sorted_result = result.sort(function(a, b) {
                        //for a
                        let course_num_a = parseInt(a.code.match(/\d+/gi)[0]);
                        if (course_num_a < 10) course_num_a = "00" + course_num_a;
                        if (course_num_a >= 10 && course_num_a < 100) course_num_a = "0" + course_num_a;
                        const course_dep_a = a.code.substring(0, a.code.indexOf(" "));
                        const last_a = a.code.charAt(a.code.length - 1);
                        const secondLast_a = a.code.charAt(a.code.length - 2);
                        let comp_string_a;
                        if (/\w/i.test(last_a) && !/\w/i.test(secondLast_a)) {
                            comp_string_a = course_num_a + last_a;
                        } else if (!/\w/i.test(last_a) && !/\w/i.test(secondLast_a)) {
                            comp_string_a = course_num_a + "0";
                        } else {
                            comp_string_a = course_num_a + last_a + secondLast_a;
                        }

                        //for b
                        let course_num_b = parseInt(b.code.match(/\d+/gi)[0]);
                        if (course_num_b < 10) course_num_b = "00" + course_num_b;
                        if (course_num_b >= 10 && course_num_b < 100) course_num_b = "0" + course_num_b;
                        const course_dep_b = b.code.substring(0, b.code.indexOf(" "));
                        const last_b = b.code.charAt(b.code.length - 1);
                        const secondLast_b = b.code.charAt(b.code.length - 2);
                        let comp_string_b;
                        if (/\w/i.test(last_b) && !/\w/i.test(secondLast_b)) {
                            comp_string_b = course_num_b + last_b;
                        } else if (!/\w/i.test(last_b) && !/\w/i.test(secondLast_b)) {
                            comp_string_b = course_num_b + "0";
                        } else {
                            comp_string_b = course_num_b + last_b + secondLast_b;
                        }


                        const major_comp = course_dep_a.localeCompare(course_dep_b);
                        if (major_comp != 0) {
                            return major_comp;
                        } else {
                            return comp_string_a.localeCompare(comp_string_b);
                        }

                    });
                    let current_course = "";
                    for(let i = 0; i < sorted_result.length; i++){
                        if((sorted_result[i].code.trim()) === current_course){
                            current_course = sorted_result[i].code.trim();
                            sorted_result.splice(i, 1);
                            i--;
                        };
                        current_course = sorted_result[i].code.trim();                 
                    }
                    for (let i = 0; i < sorted_result.length; i++) {
                        sorted_result[i].index = i;
                    };
                    planDict.set('courseData', sorted_result);
                    planDict.set('noResult', false);
                }

                planDict.set('showTable', true);
            }
        );
    },

    isNewPlan: function(){
        return !Template.instance().masterDict.get("isModify");
    },
})

Template.planSearch.events({
    "click .js-makeSchedule": function(event){
        event.preventDefault();
        const courseList = Template.instance().masterDict.get("courseList");
        if(!courseList){
            window.alert("You haven't chosen any course yet!");
            return;
        } else {
            if(courseList.length == 0) {
                window.alert("You haven't chosen any course yet!");
                return;
            } 
        };

        Template.instance().planSearchDict.set('clickedNext', true);
    },

    "click .js-changeMajor": function(event){
        event.preventDefault();
        window.location.reload();
    },

    "click .js-changeTerm": function(event){
        event.preventDefault();
        Template.instance().planSearchDict.set('clickedTerm', true);
    },
})

Template.plan_result.onCreated(function(){
    this.filter_code = new ReactiveTable.Filter('planSearch_filter_code', ['code']);
    this.filter_name = new ReactiveTable.Filter('planSearch_filter_name', ['name']);
})

Template.plan_result.onRendered(function() {
    $('.ui.accordion').accordion();
    //clean all filters first
    Template.instance().filter_code.set("");
    Template.instance().filter_name.set("");
})

Template.plan_result.helpers({
    setMasterDict: function(dict){
        Template.instance().masterDict = dict;//save the dict to the template
        Template.instance().planResultDict = dict;
    },

    detailReady: function(planDict) {
        return planDict.get('courseInfo') != null;
    },

    courseDataReady: function(planDict) {
        return planDict.get('courseData') != null;
    },

    courseData: function(planDict) {
        return planDict.get('courseData');
    },

    courseInfo: function(planDict) {
        return planDict.get('courseInfo');
    },

    majorInfo: function(planDict) {
        return planDict.get('majorDetail');
    },

    sectionData: function(planDict) {
        return planDict.get('sectionDetail');
    },

    noResult: function(planDict) {
        return planDict.get('noResult');
    },

    settings_course: function() {
        const chosen_course = Template.instance().planResultDict.get('chosenCourse');
        return {
            rowsPerPage: 10,
            showFilter: false,
            filters: ["planSearch_filter_code", "planSearch_filter_name"],
            showNavigationRowsPerPage: false,
            multiColumnSort: false,
            filterOperator: "$or",
            fields: [{
                key: 'index',
                hidden: true
            }, {
                key: 'name',
                label: 'Course',
                headerClass: "four wide",
                sortable: false
            }, {
                key: 'code',
                label: 'Code',
                headerClass: "three wide",
                sortable: false
            }, {
                key: 'description',
                label: 'Description',
                tmpl: Template.description_detail,
                headerClass: "five wide",
                sortable: false
            }, {
                key: 'add',
                label: 'Add',
                headerClass: "two wide",
                sortable: false,
                fn: function(key, object) {
                    const courseId = object.continuity_id;
                    if($.inArray(courseId, chosen_course) != -1){
                        return new Spacebars.SafeString("<div class=\"ui fitted slider checkbox\"> <input type='checkbox' id=\"" + courseId + "\" checked='checked'> <label></label> </div>");
                    } else {
                        return new Spacebars.SafeString("<div class=\"ui fitted slider checkbox\"> <input type='checkbox' id=\"" + courseId + "\"> <label></label> </div>");
                    }  
                }
            }],
        };
    },
})

Template.plan_result.events({
    "click .js-result-table tbody tr": function(event) {
        if (event.target.nodeName == "INPUT") {
            let chosen_array = Template.instance().planResultDict.get('chosenCourse');
            if(!chosen_array){
                chosen_array = [];
            };
            const isChecked = $("#" + this.continuity_id).is(":checked");
            const id = this.continuity_id;
            if(isChecked){//put the course code to the array
                chosen_array.push(id);
            } else {//remove the course code from the array
                const id_index = $.inArray(id, chosen_array);
                chosen_array.splice(id_index, 1);
            }
            Template.instance().planResultDict.set('chosenCourse', chosen_array);
            Template.instance().masterDict.set('courseList', chosen_array);//set the result to the master dict
        }
    },

    "keyup #planSearchFilter, input #planSearchFilter": function(event){
        let keyword = $(event.target).val();
        keyword = keyword.replace(/[^a-z0-9 ]/gi, "\\$&");
        //first clean all the filter settings
        Template.instance().filter_code.set("");
        Template.instance().filter_name.set("");

        //then add corresponding regex's
        const regex_code = new RegExp("^" + keyword, "i");
        const regex_name = new RegExp(keyword, "i");
        Template.instance().filter_code.set(regex_code);
        Template.instance().filter_name.set(regex_name);
    },
})
