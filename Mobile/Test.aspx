﻿<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="Test.aspx.cs" Inherits="Mobile.Test" %>

<!DOCTYPE html>



<html lang="en">
<head id="Head1" runat="server">
    <meta charset="utf-8">
    <meta name="format-detection" content="telephone=no" />
    <meta name="viewport" content="user-scalable=no, initial-scale=1, maximum-scale=1, minimum-scale=1, width=device-width, height=device-height, target-densitydpi=device-dpi" />
    <title>Kore Project Mobile App</title>
<style>
	body {
	background:#343434;
	background:url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiA/Pgo8c3ZnIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgdmlld0JveD0iMCAwIDEgMSIgcHJlc2VydmVBc3BlY3RSYXRpbz0ibm9uZSI+CiAgPHJhZGlhbEdyYWRpZW50IGlkPSJncmFkLXVjZ2ctZ2VuZXJhdGVkIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgY3g9IjUwJSIgY3k9IjUwJSIgcj0iNzUlIj4KICAgIDxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiMzNDM0MzQiIHN0b3Atb3BhY2l0eT0iMSIvPgogICAgPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjMDAwMDAwIiBzdG9wLW9wYWNpdHk9IjEiLz4KICA8L3JhZGlhbEdyYWRpZW50PgogIDxyZWN0IHg9Ii01MCIgeT0iLTUwIiB3aWR0aD0iMTAxIiBoZWlnaHQ9IjEwMSIgZmlsbD0idXJsKCNncmFkLXVjZ2ctZ2VuZXJhdGVkKSIgLz4KPC9zdmc+);
	background:-webkit-gradient(radial, center center, 0px, center center, 100%, color-stop(0%,#343434), color-stop(100%,#000000));
	background:-webkit-radial-gradient(center, ellipse cover, #343434 0%,#000000 100%);
	background:-moz-radial-gradient(center, ellipse cover, #343434 0%, #000000 100%);
	background:-ms-radial-gradient(center, ellipse cover, #343434 0%,#000000 100%);
	background:-o-radial-gradient(center, ellipse cover, #343434 0%,#000000 100%);
	background:radial-gradient(ellipse at center, #343434 0%,#000000 100%);
	
	}
	#header,
	#navigation {}
	.loader {
		top:0;
		left:0;
		width:100%;
		height:100%;
		display:block;
		position:absolute;
		background:transparent url(data:image/gif;base64,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) no-repeat center center;}
</style>
<link rel="stylesheet" href="Styles/jquery-ui.css" type="text/css" media="all" />
<link rel="stylesheet" href="style.css" type="text/css" media="all" />
<link rel="stylesheet" href="Styles/mobiscroll.css" type="text/css" media="all" />
<script src="Scripts/jquery.min.js"></script>
<script src="Scripts/jquery-ui.min.js"></script>
<script src="Scripts/jquery-ui-timepicker-addon.js"></script>
<script src="Scripts/mobiscroll.js"></script>
<script src="Scripts/application.js"></script>
<script>
    function setTargetTime(tValue, targer1, targer2, targer3) {
        if (targer1 != '') {
            //if (document.getElementById(targer1).value == '') {
            document.getElementById(targer1).value = tValue;
            //}
        }
        if (targer2 != '') {
            //if (document.getElementById(targer2).value == '') {
            document.getElementById(targer2).value = tValue;
            //}
        }
        if (targer3 != '') {
            //if (document.getElementById(targer3).value == '') {
            document.getElementById(targer3).value = tValue;
            //}
        }
    }
</script>
</head>
<body>
    <form id="Form1" runat="server">


        
    <asp:Button ID="Button1" runat="server" Text="Button" class="icon-hospital" />
      <a class="btn home"><i class="icon-home"></i></a>
</form>
<!-- ******************************************************************************************* -->
<script>
    (function () {
        var head = document.getElementsByTagName("head")[0],
            body = document.body,
            css = document.createElement("link");
        window.STYLE = false;
        window.START = undefined;

        css.onload = function () {
            STYLE = true;
            if (START !== undefined) { START(); }
        };

        css.href = "style.css";
        css.rel = "stylesheet";
        head.appendChild(css);
    })();

    var button = document.getElementById('clickMe');

    function buttonClicked() {
        alert('the button was clicked');
    }

    button.addEventListener('click', buttonClicked);
</script>
<script type="text/javascript" src="Scripts/angular.min.js"></script>
<script type="text/javascript" src="Scripts/app.js"></script>
</body>
</html>