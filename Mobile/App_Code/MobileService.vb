Imports System
Imports System.Web
Imports System.Collections
Imports System.Web.Services
Imports System.Web.Services.Protocols
Imports Warpfusion.A4PP.Objects
Imports Warpfusion.A4PP.Services
Imports Warpfusion.Shared.Utilities
Imports System.IO
Imports System.Data


Namespace Warpfusion.A4PP.WebServices
    <WebService([Namespace]:="http://mycompany.org/"), _
    WebServiceBinding(ConformsTo:=WsiProfiles.BasicProfile1_1), _
    System.Web.Script.Services.ScriptService()> _
    Public Class MobileService
        Inherits System.Web.Services.WebService

        Public Sub New()

        End Sub 'New 

        'Uncomment the following line if using designed components  
        'InitializeComponent(); 

        <WebMethod()> _
        Public Function Greetings() As String
            Dim serverTime As String = _
                String.Format("Current date and time: {0}.", DateTime.Now)
            Dim greet As String = "Hello World. <br/>" + serverTime
            Return greet

        End Function 'Greetings

        <WebMethod> _
        Public Function SayHelloJson() As String

            Dim Data As String = "Ok"

            ' We are using an anonymous object above, but we could use a typed one too (SayHello class is defined below)
            ' SayHello data = new SayHello { Greeting = "Hello", Name = firstName + " " + lastName };

            Dim js As System.Web.Script.Serialization.JavaScriptSerializer = New System.Web.Script.Serialization.JavaScriptSerializer()

            Return js.Serialize(Data)
        End Function

        '----------------------------------------------------------------
        ' Converted from C# to VB .NET using CSharpToVBConverter(1.2).
        ' Developed by: Kamal Patel (http://www.KamalPatel.net) 
        '----------------------------------------------------------------
        <WebMethod> _
        Public Shared Function GetEmployees() As String
            Return "OK-test"
        End Function

        '----------------------------------------------------------------
        ' Converted from C# to VB .NET using CSharpToVBConverter(1.2).
        ' Developed by: Kamal Patel (http://www.KamalPatel.net) 
        '----------------------------------------------------------------


        <WebMethod()> _
        Public Function AddTimeSheet(ByVal JobId As Long, ByVal TimeSheetDate As String, ByVal UserID As String, ByVal CompanyID As String, ByVal WorkStartTime As String, ByVal LunchStartTime As String, ByVal LunchEndTime As String, ByVal WorkEndTime As String, m_Description As String) As String
            Dim m_CompanyID As Integer = 0
            Dim m_UserID As Integer = 0
            Dim m_TimeSheetDate As Date
            Dim aryTimesheetDate As Array
            Dim m_WorkStartTime As DateTime
            Dim m_LunchStartTime As DateTime
            Dim m_LunchEndTime As DateTime
            Dim m_WorkEndTime As DateTime
            Dim m_Cryption As New Cryption
            Dim m_JobId As Long

            If JobId = 0 Then
                Return "Please select project job for which you are making timesheet entries."
            Else
                m_JobId = JobId
            End If

            Dim isValid As Boolean = True

            If CompanyID = "" Then
                isValid = False
            End If

            If isValid Then
                If Not Integer.TryParse(m_Cryption.Decrypt(CompanyID, m_Cryption.cryptionKey), m_CompanyID) Then
                    isValid = False
                End If
            End If

            If isValid Then
                If m_CompanyID <= 0 Then
                    isValid = False
                End If
            End If

            If isValid Then
                If UserID = "" Then
                    isValid = False
                End If
            End If

            If isValid Then
                If Not Integer.TryParse(m_Cryption.Decrypt(UserID, m_Cryption.cryptionKey), m_UserID) Then
                    isValid = False
                End If
            End If

            If isValid Then
                If m_UserID <= 0 Then
                    isValid = False
                End If
            End If

            If isValid Then
                If TimeSheetDate = "" Then
                    isValid = False
                End If
            End If

            If isValid Then
                If TimeSheetDate.IndexOf("/") <= 0 Then
                    isValid = False
                End If
            End If

            If isValid Then
                aryTimesheetDate = Split(TimeSheetDate, "/")
                If aryTimesheetDate.Length <> 3 Then
                    isValid = False
                End If
            End If

            If isValid Then
                If Not Date.TryParse(String.Format("{0}-{1}-{2}", aryTimesheetDate(2), aryTimesheetDate(1), aryTimesheetDate(0)), m_TimeSheetDate) Then
                    isValid = False
                End If
            End If

            If isValid Then
                If WorkStartTime = "" Then
                    isValid = False
                End If
            End If

            If isValid Then
                If Not DateTime.TryParse(m_TimeSheetDate.ToString("yyyy/MM/dd") & " " & WorkStartTime, m_WorkStartTime) Then
                    isValid = False
                End If
            End If

            'If isValid Then
            '    If LunchStartTime = "" Then
            '        isValid = False
            '    End If
            'End If

            If isValid Then
                If LunchStartTime <> "" Then
                    If Not DateTime.TryParse(m_TimeSheetDate.ToString("yyyy/MM/dd") & " " & LunchStartTime, m_LunchStartTime) Then
                        isValid = False
                    End If
                End If
            End If

            'If isValid Then
            '    If LunchEndTime = "" Then
            '        isValid = False
            '    End If
            'End If

            If isValid Then
                If LunchEndTime <> "" Then
                    If Not DateTime.TryParse(m_TimeSheetDate.ToString("yyyy/MM/dd") & " " & LunchEndTime, m_LunchEndTime) Then
                        isValid = False
                    End If
                End If
            End If

            If isValid Then
                If WorkEndTime = "" Then
                    isValid = False
                End If
            End If

            If isValid Then
                If Not DateTime.TryParse(m_TimeSheetDate.ToString("yyyy/MM/dd") & " " & WorkEndTime, m_WorkEndTime) Then
                    isValid = False
                End If
            End If

            If isValid Then
                Dim m_ManagementService As New ManagementService
                m_ManagementService.SQLConnection = ConfigurationManager.ConnectionStrings("ApplicationServices").ConnectionString
                Dim m_Timesheet As New TimesheetEntry
                m_Timesheet.PartyA = m_CompanyID
                m_Timesheet.PartyB = m_UserID
                m_Timesheet.WorkStart = m_WorkStartTime
                m_Timesheet.WorkEnd = m_WorkEndTime
                m_Timesheet.Description = m_Description
                m_Timesheet.JobId = m_JobId
                If LunchStartTime <> "" Then
                    m_Timesheet.LunchStart = m_LunchStartTime
                Else
                    m_Timesheet.LunchStart = Nothing
                End If
                If LunchEndTime <> "" Then
                    m_Timesheet.LunchEnd = m_LunchEndTime
                Else
                    m_Timesheet.LunchEnd = Nothing
                End If
                m_Timesheet.EntryDate = m_TimeSheetDate

                Try
                    m_ManagementService.SaveTimesheetEntry(m_Timesheet)
                Catch ex As Exception
                    If ex.Message.Contains("TIME_ALREADY_USED_IN_ANOTHER_JOB") Then
                        Throw New Exception("TIME_ALREADY_USED_IN_ANOTHER_JOB")
                    End If
                End Try

                Return "Timesheet is updated!"
            End If

            Return "Please check if you enter the timesheet correctly!"
        End Function

        <WebMethod()> _
        Public Function CreateMobJobSheet(ByVal UserId As String, CustomerName As String, Address As String, FormanOnsite As String, PhoneNo As String, ByVal JobDate As DateTime, ByVal JobDescription As String, picFile As String, picText As String, MaterialsUsed As String, JobHours As Decimal) As String

            Dim m_Cryption As New Cryption
            Dim m_UserID As Integer = 0
            Dim isValid As Boolean = True
            If isValid Then
                If UserId = "" Then
                    isValid = False
                End If
            End If

            If isValid Then
                If Not Integer.TryParse(m_Cryption.Decrypt(UserId, m_Cryption.cryptionKey), m_UserID) Then
                    isValid = False
                End If
            End If

            If isValid Then
                If m_UserID <= 0 Then
                    isValid = False
                End If
            End If


            If isValid Then


                Dim fs As FileStream = New FileStream(picFile, FileMode.Open, FileAccess.Read)

                Dim br As BinaryReader = New BinaryReader(fs)

                Dim bytes As Byte() = br.ReadBytes(Convert.ToInt32(fs.Length))

                br.Close()

                fs.Close()




                Dim m_ManagementService As New ManagementService
                m_ManagementService.SQLConnection = ConfigurationManager.ConnectionStrings("ApplicationServices").ConnectionString

                m_ManagementService.CreateMobJobSheet(m_UserID, CustomerName, Address, FormanOnsite, PhoneNo, JobDate, JobDescription, bytes, picText, MaterialsUsed, JobHours)


                Return "Saved!"
            End If

        End Function

        <WebMethod()> _
        Public Function CreateMobReorder(ByVal UserId As String, JobID As String, Reorder As String, ByVal CompanyID As String) As String
            Dim m_Cryption As New Cryption
            Dim m_UserID As Integer = 0
            Dim isValid As Boolean = True
            Dim m_CompanyID As Integer = 0

            If CompanyID = "" Then
                isValid = False
            End If

            If isValid Then
                If Not Integer.TryParse(m_Cryption.Decrypt(CompanyID, m_Cryption.cryptionKey), m_CompanyID) Then
                    isValid = False
                End If
            End If

            If isValid Then
                If m_CompanyID <= 0 Then
                    isValid = False
                End If
            End If


            If isValid Then
                If UserId = "" Then
                    isValid = False
                End If
            End If

            If isValid Then
                If Not Integer.TryParse(m_Cryption.Decrypt(UserId, m_Cryption.cryptionKey), m_UserID) Then
                    isValid = False
                End If
            End If

            If isValid Then
                If m_UserID <= 0 Then
                    isValid = False
                End If
            End If

            If isValid Then
                Dim m_ManagementService As New ManagementService
                m_ManagementService.SQLConnection = ConfigurationManager.ConnectionStrings("ApplicationServices").ConnectionString

                m_ManagementService.CreateMobReorder(m_UserID, JobID, Reorder, m_CompanyID)

                Return "Saved!"
            End If

        End Function

        <WebMethod()> _
        Public Function CRUDMobActivity(ByVal UserId As String, ProjectID As Integer, JobID As Integer,
                                   param1 As String, param2 As String, ByVal param3 As String,
                                   ByVal param4 As String, ByVal param5 As String, picFile As String,
                                     picText As String, Flag As String) As DataSet
            Dim oDs As New DataSet
            Dim m_Cryption As New Cryption
            Dim m_UserID As Integer = 0
            Dim isValid As Boolean = True
            If isValid Then
                If UserId = "" Then
                    isValid = False
                End If
            End If

            If isValid Then
                If Not Integer.TryParse(m_Cryption.Decrypt(UserId, m_Cryption.cryptionKey), m_UserID) Then
                    isValid = False
                End If
            End If

            If isValid Then
                If m_UserID <= 0 Then
                    isValid = True
                End If
            End If


            If isValid Then


                Dim fs As FileStream = New FileStream(picFile, FileMode.Open, FileAccess.Read)

                Dim br As BinaryReader = New BinaryReader(fs)

                Dim bytes As Byte() = br.ReadBytes(Convert.ToInt32(fs.Length))

                br.Close()

                fs.Close()

                Dim m_ManagementService As New ManagementService
                m_ManagementService.SQLConnection = ConfigurationManager.ConnectionStrings("ApplicationServices").ConnectionString
                ''oDs = m_ManagementService.CRUDMobActivity(m_UserID, ProjectID, JobID, param1, param2, param3, param4, param5, bytes, picText, Flag)
            End If

            Return oDs
        End Function

        <WebMethod()> _
        Public Function CreateMob(picFile As String) As String

            Dim fs As FileStream = New FileStream(picFile, FileMode.Open, FileAccess.Read)

            Dim br As BinaryReader = New BinaryReader(fs)

            Dim bytes As Byte() = br.ReadBytes(Convert.ToInt32(fs.Length))

            br.Close()

            fs.Close()




            Dim m_ManagementService As New ManagementService
            m_ManagementService.SQLConnection = ConfigurationManager.ConnectionStrings("ApplicationServices").ConnectionString

            m_ManagementService.CreateMobJobSheet(1, "CustomerName", "Address", "FormanOnsite", "PhoneNo", "2017-01-01", "JobDescription", bytes, "picText", 1, "1.001")


            Return "Please check if you enter the timesheet correctly!"

        End Function

        <WebMethod()> _
        Public Function DeleteTimeSheet(ByVal JobId As Long, ByVal TimeSheetDate As String, ByVal UserID As String, ByVal CompanyID As String) As String
            Dim m_CompanyID As Integer = 0
            Dim m_UserID As Integer = 0
            Dim m_TimeSheetDate As Date
            Dim aryTimesheetDate As Array
            Dim m_Cryption As New Cryption
            Dim m_JobId As Long

            If JobId = 0 Then
                Return "Please select project job for which you are trying to delete timesheet entries."
            Else
                m_JobId = JobId
            End If

            Dim isValid As Boolean = True

            If CompanyID = "" Then
                isValid = False
            End If

            If isValid Then
                If Not Integer.TryParse(m_Cryption.Decrypt(CompanyID, m_Cryption.cryptionKey), m_CompanyID) Then
                    isValid = False
                End If
            End If

            If isValid Then
                If m_CompanyID <= 0 Then
                    isValid = False
                End If
            End If

            If isValid Then
                If UserID = "" Then
                    isValid = False
                End If
            End If

            If isValid Then
                If Not Integer.TryParse(m_Cryption.Decrypt(UserID, m_Cryption.cryptionKey), m_UserID) Then
                    isValid = False
                End If
            End If

            If isValid Then
                If m_UserID <= 0 Then
                    isValid = False
                End If
            End If

            If isValid Then
                If TimeSheetDate = "" Then
                    isValid = False
                End If
            End If

            If isValid Then
                If TimeSheetDate.IndexOf("/") <= 0 Then
                    isValid = False
                End If
            End If

            If isValid Then
                aryTimesheetDate = Split(TimeSheetDate, "/")
                If aryTimesheetDate.Length <> 3 Then
                    isValid = False
                End If
            End If

            If isValid Then
                If Not Date.TryParse(String.Format("{0}-{1}-{2}", aryTimesheetDate(2), aryTimesheetDate(1), aryTimesheetDate(0)), m_TimeSheetDate) Then
                    isValid = False
                End If
            End If

            If isValid Then
                Dim m_ManagementService As New ManagementService
                m_ManagementService.SQLConnection = ConfigurationManager.ConnectionStrings("ApplicationServices").ConnectionString
                Dim m_Timesheet As New TimesheetEntry
                m_Timesheet.PartyA = m_CompanyID
                m_Timesheet.PartyB = m_UserID
                m_Timesheet.JobId = m_JobId
                m_Timesheet.EntryDate = m_TimeSheetDate

                Try
                    m_ManagementService.DeleteTimesheetEntry(m_Timesheet)
                Catch ex As Exception
                    If ex.Message.Contains("TIME_SHEET_IS_CLOSED") Then
                        Throw New Exception("TIME_ALREADY_USED_IN_ANOTHER_JOB")
                    ElseIf ex.Message.Contains("TIMESHEET_ENTRY_DOES_NOT_EXISTS") Then
                        Throw New Exception("TIMESHEET_ENTRY_DOES_NOT_EXISTS")
                    End If
                End Try

                Return "Timesheet is deleted!"
            End If

            Return "Please check if you enter the timesheet correctly!"
        End Function
    End Class


End Namespace
