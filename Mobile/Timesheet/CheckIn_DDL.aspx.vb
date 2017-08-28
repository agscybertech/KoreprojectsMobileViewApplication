﻿Imports System
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

Partial Class Timesheet_CheckIn_DDL
    Inherits System.Web.UI.Page
    Private m_ManagementService As New ManagementService
    Private m_LoginUser As New User
    Private m_ProjectOwner As New ProjectOwner
    Private m_Cryption As New Cryption
    Private m_Timesheet As TimesheetEntry
    Private isValidID As Boolean
    Private isValidDate As Boolean
    Private intTimeSheetEntryID As Integer
    Private dtTimeSheetEntryDate As Date

    Protected Sub Page_Load(sender As Object, e As System.EventArgs) Handles Me.Load
        m_ManagementService.SQLConnection = ConfigurationManager.ConnectionStrings("ApplicationServices").ConnectionString

        isValidID = False
        isValidDate = False
        If Session("TimeSheetEntryDate") Is Nothing Then
            If Integer.TryParse(Session("TimeSheetEntryID"), intTimeSheetEntryID) Then
                isValidID = True
            End If
        End If
        If Session("TimeSheetEntryID") Is Nothing Then
            If Date.TryParse(Session("TimeSheetEntryDate"), dtTimeSheetEntryDate) Then
                lblCdate.Text = dtTimeSheetEntryDate.ToString("ddd d-MMM-yyyy")
                isValidDate = True
            End If
        End If
        If isValidID Then
            m_Timesheet = m_ManagementService.GetTimesheetEntryByTimesheetEntryId(intTimeSheetEntryID)
            lblCdate.Text = m_Timesheet.EntryDate.ToString("ddd d-MMM-yyyy")
            If Not IsPostBack Then
                If m_Timesheet.WorkStart <> Nothing And m_Timesheet.WorkEnd <> Nothing Then
                    lblThour.Text = String.Format("Total Hours: {0}", DateDiff(DateInterval.Minute, m_Timesheet.WorkStart, m_Timesheet.WorkEnd) / 60)
                    If m_Timesheet.LunchStart <> Nothing And m_Timesheet.LunchEnd <> Nothing Then
                        lblThour.Text = String.Format("Total Hours: {0}", (DateDiff(DateInterval.Minute, m_Timesheet.WorkStart, m_Timesheet.WorkEnd) - DateDiff(DateInterval.Minute, m_Timesheet.LunchStart, m_Timesheet.LunchEnd)) / 60)
                    End If
                End If
            End If
        Else
            lblMsg.Text = "Oops! We are really sorry but this page was unable to display."
        End If

        If Not IsPostBack Then
            'ddlHour.Items.Clear()
            For index As Integer = 1 To 12
                Dim li As New ListItem
                li.Text = index
                li.Value = index
                ddlHour.Items.Add(li)
                ddlHour1.Items.Add(li)
                ddlHour2.Items.Add(li)
                ddlHour3.Items.Add(li)
            Next

            'ddlMins.Items.Clear()
            For index As Integer = 0 To 55 Step 5
                Dim li As New ListItem
                li.Text = index
                li.Value = index
                ddlMins.Items.Add(li)
                ddlMins1.Items.Add(li)
                ddlMins2.Items.Add(li)
                ddlMins3.Items.Add(li)
            Next
        End If
    End Sub

    Protected Sub Page_PreInit(ByVal sender As Object, ByVal e As System.EventArgs) Handles Me.PreInit
        If Session("CurrentLogin") Is Nothing Then
            Response.Redirect("../Login.aspx?msg=Time out!")
        Else
            m_LoginUser = Session("CurrentLogin")
            'If m_LoginUser.Type = 0 Then
            '    btnDelete.Visible = False
            'End If
        End If
        If Request.QueryString("msg") <> "" Then
            lblMsg.Text = Request.QueryString("msg")
        End If
    End Sub

    Protected Sub btnCancel_Click(sender As Object, e As EventArgs) Handles btnCancel.Click
        Response.Redirect("../Timesheet/")
    End Sub
End Class
