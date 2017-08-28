var MobileServiceProxy;

// Initializes global and proxy default variables.
function pageLoad() {

    // Instantiate the service proxy.
    MobileServiceProxy = new Warpfusion.A4PP.WebServices.MobileService();

    // Set the default call back functions.
    MobileServiceProxy.set_defaultSucceededCallback(SucceededCallback);
    MobileServiceProxy.set_defaultFailedCallback(FailedCallback);
}


// Processes the button click and calls
// the service Greetings method.  
function OnClickGreetings() {
    //debugger;
    //var greetings = jQuery.parseJSON(MobileServiceProxy.Greetings());
    var greetings = MobileServiceProxy.Greetings();

}

function AddTimeSheet(JobId,TimeSheetDate, UserID, CompanyID, WorkStartTime, LunchStartTime, LunchEndTime, WorkEndTime, Description) {
    var TimeSheet = MobileServiceProxy.AddTimeSheet(JobId, TimeSheetDate, UserID, CompanyID, WorkStartTime, LunchStartTime, LunchEndTime, WorkEndTime, Description);
}

function CreateMobJobSheet(UserId, CustomerName, Address, FormanOnsite, PhoneNo, JobDate, JobDescription, picFile, picText, MaterialsUsed, JobHours) {
    //var MobJobSheet = MobileServiceProxy.CreateMob(picFile);//MobileServiceProxy.CreateMobJobSheet(UserId, CustomerName, Address, FormanOnsite, PhoneNo, JobDate, JobDescription, picFile, picText, MaterialsUsed, JobHours);
    var MobJobSheet = MobileServiceProxy.CreateMobJobSheet(UserId, CustomerName, Address, FormanOnsite, PhoneNo, "2017-01-01", JobDescription, picFile, picText, MaterialsUsed, JobHours);
}


function CRUDMobActivity(UserId, ProjectID, JobID, param1, param2, param3, param4, param5, picFile, picText, Flag) {
    //var MobJobSheet = MobileServiceProxy.CreateMob(picFile);//MobileServiceProxy.CreateMobJobSheet(UserId, CustomerName, Address, FormanOnsite, PhoneNo, JobDate, JobDescription, picFile, picText, MaterialsUsed, JobHours);
    var MobCRUD = MobileServiceProxy.CRUDMobActivity(UserId, ProjectID, JobID, param1, param2, param3, param4, param5, picFile, picText, Flag);
    debugger;
}

function CreateMobReorder(UserId, JobID, Reorder, CompanyID) {
    var MobReorder = MobileServiceProxy.CreateMobReorder(UserId, JobID, Reorder, CompanyID);
}

// Callback function that
// processes the service return value.
function SucceededCallback(result) {
    //alert(result);
    //var RsltElem = document.getElementById("WorkStart");
    //RsltElem.value = result;
    //alert(RsltElem.value);
    //RsltElem = document.getElementById("Results");
    //RsltElem.innerHTML = result;
    //alert(RsltElem.innerHTML);
}

// Callback function invoked when a call to 
// the  service methods fails.
function FailedCallback(error, userContext, methodName) {
    if (error !== null) {
        var RsltElem = document.getElementById("Results");

        RsltElem.innerHTML = "An error occurred: " +
            error.get_message();
    }
}

if (typeof (Sys) !== "undefined") Sys.Application.notifyScriptLoaded();