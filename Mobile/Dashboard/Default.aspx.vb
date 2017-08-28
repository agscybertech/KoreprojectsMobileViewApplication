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
Imports System.Web.Services
Imports System.IO
Imports System.Drawing.Imaging

Partial Class _Default
    Inherits System.Web.UI.Page
    Private m_ManagementService As New ManagementService
    Private m_LoginUser As New User
    Private m_ProjectOwner As New ProjectOwner
    Private m_Cryption As New Cryption
    Private m_LastBillingEndDate As Date
    Private m_NextBillingEndDate As Date
    Private m_Timesheets As New DataSet

    Protected Sub Page_PreInit(ByVal sender As Object, ByVal e As System.EventArgs) Handles Me.PreInit



        If Session("CurrentLogin") Is Nothing Then
            For I = 0 To Request.Cookies.Count - 1
                If Request.Cookies.Item(I).Name = "KoreMobileApp" Then
                    If Request.Cookies.Item(I)("Link") <> "" Then
                        Response.Redirect(String.Format("../Login.aspx?link={0}", Request.Cookies.Item(I)("Link")))
                    End If
                End If
            Next
            Response.Redirect("../Login.aspx?msg=Time out!")
        Else
            m_LoginUser = Session("CurrentLogin")
            'If m_LoginUser.Type = 0 Then
            '    btnDelete.Visible = False
            'End If
        End If
    End Sub

    ''Public Shared Function GetEmployees(ByVal UserId As String, ProjectID As Integer) As String
    <WebMethod> _
    Public Shared Function GetEmployees(ByVal UserId As String, ProjectID As Integer, JobID As Integer,
                                   param1 As String, param2 As String, ByVal param3 As String,
                                   ByVal param4 As String, ByVal param5 As String, picFile As String,
                                     picText As String, Flag As String) As String
        Return "OK-test"
    End Function

    <WebMethod()> _
    Public Shared Function CRUDMobActivity(ByVal UserId As String, ProjectID As Integer, JobID As Integer,
                                   param1 As String, param2 As String, ByVal param3 As String,
                                   ByVal param4 As String, ByVal param5 As String, picFile As String,
                                     picText As String, Flag As String) As String
        Dim oDs As New DataTable
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
            Dim bytes As Byte()
            If (picFile <> "") Then


                Dim fs As FileStream = New FileStream(picFile, FileMode.Open, FileAccess.Read)

                Dim br As BinaryReader = New BinaryReader(fs)

                bytes = br.ReadBytes(Convert.ToInt32(fs.Length))

                br.Close()

                fs.Close()

            Else
                Dim Str As String

                Str = "Hello world!"
                ' Convert string to bytes
                bytes = System.Text.Encoding.Default.GetBytes(Str)
            End If

            Dim m_ManagementService As New ManagementService




            If (Flag <> "PhotoUpload") Then

                m_ManagementService.SQLConnection = ConfigurationManager.ConnectionStrings("ApplicationServices").ConnectionString
                oDs = m_ManagementService.CRUDMobActivity(m_UserID, ProjectID, JobID, param1, param2, param3, param4, param5, bytes, picText, Flag)
                Dim dt As New System.Data.DataTable
                dt = oDs
                Dim serializer As New System.Web.Script.Serialization.JavaScriptSerializer()
                Dim packet As New List(Of Dictionary(Of String, Object))()
                Dim row As Dictionary(Of String, Object) = Nothing
                For Each dr As DataRow In dt.Rows
                    row = New Dictionary(Of String, Object)()
                    For Each dc As DataColumn In dt.Columns
                        row.Add(dc.ColumnName.Trim(), dr(dc))
                    Next
                    packet.Add(row)
                Next
                Return serializer.Serialize(packet)

            ElseIf (Flag = "PhotoUpload") Then


                m_ManagementService.SQLConnection = ConfigurationManager.ConnectionStrings("ApplicationServices").ConnectionString
                Dim m_ContactUserProfile As New UserProfile
                m_ContactUserProfile = m_ManagementService.GetUserProfileByUserID(m_UserID)

                Dim limitX As Integer = ConfigurationManager.AppSettings("USERPHOTOWIDTH")
                Dim limitY As Integer = ConfigurationManager.AppSettings("USERPHOTOHEIGHT")
                Dim x As Integer = 0
                Dim y As Integer = 0
                Dim newX As Integer = 0
                Dim newY As Integer = 0

                Dim mStream = New MemoryStream()

                Dim imgFile As System.Drawing.Image
                imgFile = System.Drawing.Image.FromFile(param3)


                x = imgFile.Width
                y = imgFile.Height

                If (x > limitX Or y > limitY) Then
                    If (x * 1.0 / y >= limitX * 1.0 / limitY) Then
                        newX = limitX
                        newY = CType((y * (limitX * 1.0 / x)), Integer)
                    Else
                        newY = limitY
                        newX = CType((x * (limitY * 1.0 / y)), Integer)
                    End If
                Else
                    newX = x
                    newY = y
                End If

                resizeimage(imgFile, newX, newY, mStream)

                Dim uploadedFile(mStream.Length) As Byte

                uploadedFile = mStream.ToArray()
                mStream.Close()

                Dim NewFileName As String = String.Format("{0}", Now.ToString("yyyyMMddHHmmss"))
                Dim strUserFileDescription As String
                strUserFileDescription = String.Format("{0}\images\{1}\{2}.jpg", ConfigurationManager.AppSettings("ProjectPath"), m_ContactUserProfile.Identifier, NewFileName)
                If (Not System.IO.Directory.Exists(String.Format("{0}\images\{1}", ConfigurationManager.AppSettings("ProjectPath"), m_ContactUserProfile.Identifier))) Then
                    System.IO.Directory.CreateDirectory(String.Format("{0}\images\{1}", ConfigurationManager.AppSettings("ProjectPath"), m_ContactUserProfile.Identifier))
                End If

                Dim wFile As FileStream
                wFile = New FileStream(strUserFileDescription, FileMode.Create)
                wFile.Write(uploadedFile, 0, uploadedFile.Length)
                wFile.Close()

                'Dim CurrentFile As New UserFile
                'CurrentFile.Owner = m_UserID

                'CurrentFile.FileName = NewFileName
                'CurrentFile.FileExtension = "jpg"
                'CurrentFile.Description = param2
                'm_ManagementService.CreateUserFile(CurrentFile)

                m_ManagementService.SQLConnection = ConfigurationManager.ConnectionStrings("ApplicationServices").ConnectionString
                oDs = m_ManagementService.CRUDMobActivity(m_UserID, ProjectID, JobID, param1, param2, param3, NewFileName, "jpg", bytes, picText, Flag)
                Dim dt As New System.Data.DataTable
                dt = oDs
                Dim serializer As New System.Web.Script.Serialization.JavaScriptSerializer()
                Dim packet As New List(Of Dictionary(Of String, Object))()
                Dim row As Dictionary(Of String, Object) = Nothing
                For Each dr As DataRow In dt.Rows
                    row = New Dictionary(Of String, Object)()
                    For Each dc As DataColumn In dt.Columns
                        row.Add(dc.ColumnName.Trim(), dr(dc))
                    Next
                    packet.Add(row)
                Next
                Return serializer.Serialize(packet)

            End If

        End If

    End Function

    Public Shared Function resizeimage(ByVal objImage As System.Drawing.Image, ByVal width As Integer, ByVal height As Integer, ByRef imgStream As IO.MemoryStream) As String
        'Create the delegate
        Dim dummyCallBack As System.Drawing.Image.GetThumbnailImageAbort
        dummyCallBack = New  _
          System.Drawing.Image.GetThumbnailImageAbort(AddressOf ThumbnailCallback)
        Dim thumbNailImg As System.Drawing.Image
        objImage.RotateFlip(System.Drawing.RotateFlipType.Rotate180FlipNone)
        objImage.RotateFlip(System.Drawing.RotateFlipType.Rotate180FlipNone)
        thumbNailImg = objImage.GetThumbnailImage(width, height, dummyCallBack, IntPtr.Zero)
        'Response.ContentType = "image/gif"
        thumbNailImg.Save(imgStream, ImageFormat.Jpeg)
        thumbNailImg.Dispose()
        Return "Ok"
    End Function

    Public Shared Function ThumbnailCallback() As Boolean
        Return False
    End Function

End Class
