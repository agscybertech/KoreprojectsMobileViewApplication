<%@ WebHandler Language="VB" Class="master" %>

Imports System
Imports System.Collections
Imports System.Linq
Imports System.Configuration
Imports System.Web
Imports System.Web.UI
Imports System.Web.UI.WebControls
Imports Warpfusion.A4PP.Objects
Imports Warpfusion.A4PP.Services
Imports Warpfusion.Shared.Utilities
Imports System.Data
Imports System.Data.SqlClient
Imports System.Xml

Public Class master : Implements IHttpHandler, IRequiresSessionState
    Private m_ManagementService As New ManagementService
    Private m_LoginUser As New User
    Private m_ProjectOwner As New ProjectOwner
    Private m_UserProfile As New UserProfile
    Private m_Cryption As New Cryption
    Private m_LastBillingEndDate As Date
    Private m_NextBillingEndDate As Date
    Private m_Timesheets As New DataSet
    Private m_BillingCycles As New ArrayList
    
    Public Sub ProcessRequest(ByVal context As HttpContext) Implements IHttpHandler.ProcessRequest
        context.Response.ContentType = "text/plain"
        If Not context.Session("CurrentLogin") Is Nothing Then
            m_LoginUser = context.Session("CurrentLogin")
            m_ManagementService.SQLConnection = ConfigurationManager.ConnectionStrings("ApplicationServices").ConnectionString
            m_ProjectOwner = m_ManagementService.GetProjectOwnerByProjectOwnerId(m_LoginUser.CompanyId)

            Dim isValid As Boolean
            Dim sMaster As String = String.Empty
            Dim dtStart As New Date
            Dim dtEnd As New Date

            isValid = False
            Dim rsLastBillingEnd As DataSet = m_ManagementService.GetTimesheetLastCycleEndDateByPartyAPartyB(m_LoginUser.CompanyId, m_LoginUser.UserId)
            If rsLastBillingEnd.Tables.Count > 0 Then
                If rsLastBillingEnd.Tables(0).Rows.Count > 0 Then
                    If Not IsDBNull(rsLastBillingEnd.Tables(0).Rows(0)("LastCycleEndDate")) Then
                        m_LastBillingEndDate = DateAdd(DateInterval.Day, 1, rsLastBillingEnd.Tables(0).Rows(0)("LastCycleEndDate"))
                        isValid = True
                    End If
                End If
            End If
            If Not isValid Then
                If Not IsNothing(m_ProjectOwner.PaymentStartDate) Then
                    m_LastBillingEndDate = m_ProjectOwner.PaymentStartDate
                    isValid = True
                End If
            End If

            If isValid Then
                If DateDiff(DateInterval.Day, m_LastBillingEndDate, TimeZoneInfo.ConvertTime(DateTime.UtcNow, TimeZoneInfo.FindSystemTimeZoneById("New Zealand Standard Time"))) < 0 Then
                    isValid = False
                End If
            End If

            If isValid Then
                Dim aryCycle(1) As Date
                aryCycle(0) = m_LastBillingEndDate
                Select Case m_ProjectOwner.Frequency
                    Case "1,w"
                        m_NextBillingEndDate = DateAdd(DateInterval.Day, 7, m_LastBillingEndDate)
                        aryCycle(1) = m_NextBillingEndDate
                        m_BillingCycles.Add(aryCycle)
                        Do Until TimeZoneInfo.ConvertTime(DateTime.UtcNow, TimeZoneInfo.FindSystemTimeZoneById("New Zealand Standard Time")) >= m_LastBillingEndDate And TimeZoneInfo.ConvertTime(DateTime.UtcNow, TimeZoneInfo.FindSystemTimeZoneById("New Zealand Standard Time")) < m_NextBillingEndDate
                            m_LastBillingEndDate = m_NextBillingEndDate
                            m_NextBillingEndDate = DateAdd(DateInterval.Day, 7, m_LastBillingEndDate)
                            ReDim aryCycle(1)
                            aryCycle(0) = m_LastBillingEndDate
                            aryCycle(1) = m_NextBillingEndDate
                            m_BillingCycles.Add(aryCycle)
                        Loop
                    Case "2,w"
                        m_NextBillingEndDate = DateAdd(DateInterval.Day, 14, m_LastBillingEndDate)
                        aryCycle(1) = m_NextBillingEndDate
                        m_BillingCycles.Add(aryCycle)
                        Do Until TimeZoneInfo.ConvertTime(DateTime.UtcNow, TimeZoneInfo.FindSystemTimeZoneById("New Zealand Standard Time")) >= m_LastBillingEndDate And TimeZoneInfo.ConvertTime(DateTime.UtcNow, TimeZoneInfo.FindSystemTimeZoneById("New Zealand Standard Time")) <= m_NextBillingEndDate
                            m_LastBillingEndDate = m_NextBillingEndDate
                            m_NextBillingEndDate = DateAdd(DateInterval.Day, 14, m_LastBillingEndDate)
                            ReDim aryCycle(1)
                            aryCycle(0) = m_LastBillingEndDate
                            aryCycle(1) = m_NextBillingEndDate
                            m_BillingCycles.Add(aryCycle)
                        Loop
                    Case "1,m"
                        m_NextBillingEndDate = DateAdd(DateInterval.Month, 1, m_LastBillingEndDate)
                        aryCycle(1) = m_NextBillingEndDate
                        m_BillingCycles.Add(aryCycle)
                        Do Until TimeZoneInfo.ConvertTime(DateTime.UtcNow, TimeZoneInfo.FindSystemTimeZoneById("New Zealand Standard Time")) >= m_LastBillingEndDate And TimeZoneInfo.ConvertTime(DateTime.UtcNow, TimeZoneInfo.FindSystemTimeZoneById("New Zealand Standard Time")) <= m_NextBillingEndDate
                            m_LastBillingEndDate = m_NextBillingEndDate
                            m_NextBillingEndDate = DateAdd(DateInterval.Month, 1, m_LastBillingEndDate)
                            ReDim aryCycle(1)
                            aryCycle(0) = m_LastBillingEndDate
                            aryCycle(1) = m_NextBillingEndDate
                            m_BillingCycles.Add(aryCycle)
                        Loop
                    Case Else
                        isValid = False
                End Select
            End If

            If isValid Then
                If m_BillingCycles.Count > 4 Then
                    Dim tempArrayList As New ArrayList
                    tempArrayList.Add(m_BillingCycles(m_BillingCycles.Count - 4))
                    tempArrayList.Add(m_BillingCycles(m_BillingCycles.Count - 3))
                    tempArrayList.Add(m_BillingCycles(m_BillingCycles.Count - 2))
                    tempArrayList.Add(m_BillingCycles(m_BillingCycles.Count - 1))
                    m_BillingCycles = tempArrayList
                    'For index As Integer = 0 To m_BillingCycles.Count - 4 - 1
                    '    m_BillingCycles.RemoveAt(0)
                    'Next
                End If
                
                Dim isProcessed As Boolean
                m_UserProfile = m_ManagementService.GetUserProfileByUserID(m_LoginUser.UserId)
                sMaster = "{""userid"":""" & m_Cryption.Encrypt(m_LoginUser.UserId, m_Cryption.cryptionKey) & """,""user"":""" & m_UserProfile.FirstName & """,""companyid"":""" & m_Cryption.Encrypt(m_LoginUser.CompanyId, m_Cryption.cryptionKey) & """,""company"":""" & m_ProjectOwner.Name & """,""payday"":""" & Weekday(m_NextBillingEndDate) & """,""date"":{""day"":""" & Day(Now) & """,""month"":""" & Month(Now) & """,""year"":""" & Year(Now) & """},""weeks"":["
                ''sMaster = String.Format("{""payday"":""{0}"",""date"":{""day"":""{1}"",""month"":""{2}"",""year"":""{3}""},""weeks"":[", Weekday(m_NextBillingEndDate), Day(Now), Month(Now), Year(Now))
                
                If Not context.Request.QueryString("jobid") Is Nothing ANdALso Convert.ToInt64(context.Request.QueryString("jobid")) > 0 Then
                    For index As Integer = 0 To m_BillingCycles.Count - 1
                        Dim aryBillingDate As Date()
                        isProcessed = False
                        aryBillingDate = m_BillingCycles.Item(index)
                        m_Timesheets = New DataSet()
                        m_Timesheets = m_ManagementService.GetTimesheetEntryByPartyAPartyBJobEntryDateRange(m_LoginUser.CompanyId, m_LoginUser.UserId, aryBillingDate(0), DateAdd(DateInterval.Day, -1, aryBillingDate(1)), Convert.ToInt64(context.Request.QueryString("jobid")) )
                    
                        If m_Timesheets.Tables.Count > 0 Then
                            If m_Timesheets.Tables(0).Rows.Count > 0 Then
                                sMaster = String.Format("{0}[", sMaster)
                                For Each tr As DataRow In m_Timesheets.Tables(0).Rows
                                    sMaster = sMaster & "{""name"":""" & WeekdayName(Weekday(tr("dt"), Microsoft.VisualBasic.FirstDayOfWeek.Sunday), True) & """,""date"":""" & CDate(tr("dt")).ToString("d/M/yyyy") & ""","
                                    'sMaster = String.Format("{0}{""name"":""{1}"",""date"":""{2}"",", sMaster, WeekdayName(Weekday(tr("dt")), True), tr("dt").ToString("d/M/yyyy"))
                                    If Not IsDBNull(tr("hrs")) Then
                                        sMaster = sMaster & """value"":""" & tr("hrs") & """,""hours"":{"
                                        'sMaster = String.Format("{0}""value"":""{1}"",""hours"":{", sMaster, tr("hrs"))
                                    Else
                                        sMaster = sMaster & """value"":""0"",""hours"":{"
                                        'sMaster = String.Format("{0}""value"":"""",""hours"":{", sMaster)
                                    End If
                                    If Not IsDBNull(tr("WorkStart")) Then
                                        sMaster = sMaster & """s"":""" & Replace(CDate(tr("WorkStart")).ToString("hh:mm tt"), ".", "") & ""","
                                        'sMaster = String.Format("{0}""s"":""{1}"",", sMaster, tr("WorkStart").ToString("hh:mm tt"))
                                    Else
                                        sMaster = sMaster & """s"":"""","
                                        'sMaster = String.Format("{0}""s"":"""",", sMaster)
                                    End If
                                    If Not IsDBNull(tr("LunchStart")) Then
                                        sMaster = sMaster & """sl"":""" & Replace(CDate(tr("LunchStart")).ToString("hh:mm tt"), ".", "") & ""","
                                        'sMaster = String.Format("{0}""sl"":""{1}"",", sMaster, tr("LunchStart").ToString("hh:mm tt"))
                                    Else
                                        sMaster = sMaster & """sl"":"""","
                                        'sMaster = String.Format("{0}""sl"":"""",", sMaster)
                                    End If
                                    If Not IsDBNull(tr("LunchEnd")) Then
                                        sMaster = sMaster & """fl"":""" & Replace(CDate(tr("LunchEnd")).ToString("hh:mm tt"), ".", "") & ""","
                                        'sMaster = String.Format("{0}""fl"":""{1}"",", sMaster, tr("LunchEnd").ToString("hh:mm tt"))
                                    Else
                                        sMaster = sMaster & """fl"":"""","
                                        'sMaster = String.Format("{0}""fl"":"""",", sMaster)
                                    End If
                                    If Not IsDBNull(tr("WorkEnd")) Then
                                        sMaster = sMaster & """f"":""" & Replace(CDate(tr("WorkEnd")).ToString("hh:mm tt"), ".", "") & """}},"
                                        'sMaster = String.Format("{0}""f"":""{1}""}},", sMaster, tr("WorkEnd").ToString("hh:mm tt"))
                                    Else
                                        sMaster = sMaster & """f"":""""}},"
                                        'sMaster = String.Format("{0}""f"":""""}},", sMaster)
                                    End If
                                    If Not IsDBNull(tr("ProcessDate")) And Not isProcessed Then
                                        isProcessed = True
                                    End If
                                Next
                                If isProcessed Then
                                    sMaster = sMaster & """true""]"
                                    'sMaster = String.Format("{0}""true""]", sMaster)
                                Else
                                    sMaster = sMaster & """false""]"
                                    'sMaster = String.Format("{0}""false""]", sMaster)
                                End If
                                If m_BillingCycles.Count - 1 <> index Then
                                    sMaster = sMaster & ","
                                End If
                            End If
                        End If
                    Next
                    
                End If
                'm_Timesheets = m_ManagementService.GetTimesheetEntryByPartyAPartyBEntryDateRange(m_LoginUser.CompanyId, m_LoginUser.UserId, m_LastBillingEndDate, DateAdd(DateInterval.Day, -1, m_NextBillingEndDate))
                sMaster = sMaster & "]}"
                'sMaster = sMaster & "],""messages"":[{""from"":""Jimi Hendrix"",""msg"": ""I'm first message. Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.<br>Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.""}]}"
                'sMaster = String.Format("{0}],""messages"":[{""from"":""Jimi Hendrix"",""msg"": ""I'm first message. Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.<br>Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.""}]}", sMaster)
            End If
            
            context.Response.Write(sMaster)
        End If
    End Sub
 
    Public ReadOnly Property IsReusable() As Boolean Implements IHttpHandler.IsReusable
        Get
            Return False
        End Get
    End Property

End Class