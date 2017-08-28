<%@ Page Language="VB" AutoEventWireup="false" CodeFile="Default.aspx.vb" Inherits="_Default" %>

<!DOCTYPE html>

<html lang="en">
<head runat="server">
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="format-detection" content="telephone=no" />
    <meta name="viewport" content="user-scalable=no, initial-scale=1, maximum-scale=1, minimum-scale=1, width=device-width, height=device-height, target-densitydpi=device-dpi" />
    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
    <meta http-equiv="Pragma" content="no-cache" />
    <meta http-equiv="Expires" content="0" />
    <title>Kore Project Mobile App</title>
    <style>
        .overlay {
            position: fixed;
            z-index: 98;
            top: 0px;
            left: 0px;
            right: 0px;
            bottom: 0px;
            background-color: rgba(170, 170, 170, 0.5);
            filter: alpha(opacity=80);
        }

        .overlayContent {
            z-index: 99;
            margin: 280px auto;
        }

        .glyphicon.normal-right-spinner {
            -webkit-animation: glyphicon-spin-r 2s infinite linear;
            animation: glyphicon-spin-r 2s infinite linear;
            font-size: 25px;
        }

        @-webkit-keyframes glyphicon-spin-r {
            0% {
                -webkit-transform: rotate(0deg);
                transform: rotate(0deg);
            }

            100% {
                -webkit-transform: rotate(359deg);
                transform: rotate(359deg);
            }
        }

        @keyframes glyphicon-spin-r {
            0% {
                -webkit-transform: rotate(0deg);
                transform: rotate(0deg);
            }

            100% {
                -webkit-transform: rotate(359deg);
                transform: rotate(359deg);
            }
        }
    </style>

    <link href="../Styles/bootstrap.min.css" rel="stylesheet">
    <link href="../Styles/style.css" rel="stylesheet">
    <link rel="stylesheet" href="../Styles/mobiscroll.css" type="text/css" media="all" />

    <script src="../Scripts/jquery.min.js"></script>
    <script src="../Scripts/bootstrap.min.js"></script>
    <script src="../Scripts/jquery-ui.min.js"></script>
    <script src="../Scripts/jquery-ui-timepicker-addon.js"></script>
    <script src="../Scripts/mobiscroll.js"></script>
    <script src="../Scripts/application.js"></script>


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
<body data-ng-app="App" data-ng-controller="AppCtrl">
    <form id="Form1" runat="server">
        <asp:ScriptManager runat="server" ID="scriptManager">
            <Services>
                <asp:ServiceReference Path="~/MobileService.asmx" />
            </Services>
            <Scripts>
                <asp:ScriptReference Path="~/Scripts/MobileService.js" />
            </Scripts>
        </asp:ScriptManager>

        <header class="navbar-fixed-top" id="header">
            <div class="row">
                <div class="col-xs-4 text-left">
                    <h2 class="main_heading" data-ng-show="$route.current.activetab != 'timesheet-edit'">{{company_name}}</h2>
                    <%--<a data-ng-click="goTo('sending/')" class="new" data-ng-show="$route.current.activetab != 'sending'">New</a>--%>
                    <a data-ng-click="goTo('')" data-ng-show="$route.current.activetab == 'sending'" class="arrow_jobs">
                        <img src="../images/arrow-jobs.png" alt="img" width="20" height="13"></a>
                    <a data-ng-click="goTo('timesheet')" data-ng-show="$route.current.activetab == 'timesheet-edit'" class="arrow_jobs">
                        <img src="../images/arrow-jobs.png" alt="img" width="20" height="13"></a>
                </div>
                <div class="col-xs-4">
                    <%--<h2 class="main_heading">{{company_name}}</h2>--%>
                </div>
                <div class="col-xs-4 navbar-right">
                    <div class="dropdown pull-right">
                        <a href="#" class="manny" onclick="myFunction()">{{user_name}}</a>
                        <div id="myDropdown" class="dropdown-content">
                            <a href="#" class="manny1">{{user_name}}</a>
                            <a href="#" data-ng-click="logout()" class="logout">Logout</a>
                        </div>
                    </div>
                </div>
            </div>
        </header>
        <div class="overlay" data-ng-hide="loaded">
            <div class="overlayContent" style="color: #000; text-align: center; width: 320px; padding: 20px; background-color:#FFF">
                <table>
                    <tbody>
                        <tr>
                            <td>
                                <img src="../images/logo.png" alt="#"></td>
                            <td style="padding-left: 17px;">
                                <i class="glyphicon glyphicon-repeat normal-right-spinner"></i>
                                <h3>Processing Request</h3>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
        <div class="job_detail_outer">
            <div class="container-fluid">
                <div class="tab-content">
                    <div class="ng-view"></div>
                </div>
            </div>
        </div>
        <footer id="navigation" data-ng-class="{show:navigation}">
            <ul class="nav nav-tabs">
                <li data-ng-class="{active: $route.current.activetab == 'jobs'}"><a data-toggle="tab" data-ng-click="goTo('jobs')">
                    <img src="../images/job-ficon1.png" alt="icon" width="28" height="25"><img src="../images/job-ficon-h1.png" alt="icon" width="28" height="25"></a></li>
                <li data-ng-class="{active: $route.current.activetab == 'timesheet'}"><a data-toggle="tab" data-ng-click="goTo('timesheet')">
                    <img src="../images/job-ficon2.png" alt="icon" width="24" height="24"><img src="../images/job-ficon-h2.png" alt="icon" width="24" height="24"></a></li>
                <li data-ng-class="{active: $route.current.activetab == 'photos'}"><a data-toggle="tab" data-ng-click="goTo('photos')">
                    <img src="../images/job-ficon3.png" alt="icon" width="24" height="23"><img src="../images/job-ficon-h3.png" alt="icon" width="24" height="23"></a></li>
                <li data-ng-class="{active: $route.current.activetab == 'reorder'}"><a data-toggle="tab" data-ng-click="goTo('reorder')">
                    <img src="../images/job-ficon4.png" alt="icon" width="23" height="24"><img src="../images/job-ficon-h4.png" alt="icon" width="23" height="24"></a></li>
                <li data-ng-class="{active: $route.current.activetab == 'dashboard'}"><a data-toggle="tab" data-ng-click="goTo('')">
                    <img src="../images/job-ficon5.png" alt="icon" width="25" height="24"><img src="../images/job-ficon-h5.png" alt="icon" width="25" height="24"></a></li>
            </ul>
        </footer>
    </form>
    <div>
        <span id="Results"></span>
    </div>

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

            css.href = "../Styles/app.css";
            css.rel = "stylesheet";
            head.appendChild(css);
        })();

        function myFunction() {
            document.getElementById("myDropdown").classList.toggle("show");
        }
    </script>

    <script type="text/javascript" src="../Scripts/angular.min.js"></script>
    <script type="text/javascript" src="../Scripts/app.js"></script>
</body>
</html>
