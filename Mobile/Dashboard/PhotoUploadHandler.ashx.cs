using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Warpfusion.A4PP.Services;
using System.Configuration;
using Warpfusion.A4PP.Objects;
using Warpfusion.Shared.Utilities;

namespace Mobile
{
    /// <summary>
    /// Summary description for PhotoUploadHandler
    /// </summary>
    public class PhotoUploadHandler : IHttpHandler
    {

        public void ProcessRequest(HttpContext context)
        {
            ManagementService m_ManagementService = new ManagementService();
            m_ManagementService.SQLConnection = ConfigurationManager.ConnectionStrings["ApplicationServices"].ConnectionString;

            if (context.Request.Files.Count > 0)
            {
                try
                {

                    Cryption m_Cryption = new Cryption();
                    Int32 m_UserID = 0;
                    bool isValid = true;

                    if (string.IsNullOrEmpty(context.Request.Form["UserId"]))
                    {
                        isValid = false;
                    }


                    if (isValid)
                    {
                        if (!Int32.TryParse(m_Cryption.Decrypt(context.Request.Form["UserId"], m_Cryption.cryptionKey), out m_UserID))
                        {
                            isValid = false;
                        }
                    }

                    if (m_UserID <= 0)
                    {
                        isValid = false;
                    }

                    
                    if (isValid)
                    {
                        UserProfile m_ContactUserProfile = new UserProfile();
                        m_ContactUserProfile = m_ManagementService.GetUserProfileByUserID(m_UserID);

                        HttpFileCollection files = context.Request.Files;

                        for (int i = 0; i < files.Count; i++)
                        {
                            HttpPostedFile file = files[i];


                            string filename = String.Format("{0}", DateTime.Now.ToString("yyyyMMddHHmmss"));
                            string extension = System.IO.Path.GetExtension(file.FileName);
                            string filePath = String.Format(@"{0}\images\{1}\{2}{3}", ConfigurationManager.AppSettings["WebProjectPath"], m_ContactUserProfile.Identifier, filename, extension);

                            if (!System.IO.Directory.Exists(String.Format(@"{0}\images\{1}", ConfigurationManager.AppSettings["WebProjectPath"], m_ContactUserProfile.Identifier)))
                            {
                                System.IO.Directory.CreateDirectory(String.Format(@"{0}\images\{1}", ConfigurationManager.AppSettings["WebProjectPath"], m_ContactUserProfile.Identifier));
                            }

                            using (var binaryReader = new System.IO.BinaryReader(file.InputStream))
                            {
                                byte[] fileData = binaryReader.ReadBytes(file.ContentLength);

                                System.IO.FileStream wFile = new System.IO.FileStream(filePath, System.IO.FileMode.Create);
                                wFile.Write(fileData, 0, file.ContentLength);
                                wFile.Close();

                                m_ManagementService.CRUDMobActivity(m_UserID, 0, Convert.ToInt32(context.Request.Form["JobId"]), Convert.ToString(context.Request.Form["Date"]), Convert.ToString(context.Request.Form["Description"]), m_ContactUserProfile.Identifier, filename, extension.Replace(".", ""), fileData, filename, "PhotoUpload");
                            }
                        }

                    }
                    else
                    {
                        throw new Exception("Invalid User");
                    }
                }
                catch (Exception ex)
                {
                    m_ManagementService.LogError(ex.Message, ex.StackTrace);
                    context.Response.StatusCode = 400;
                    context.Response.ContentType = "json";
                    context.Response.Write("{success: 'false', message: '" + ex.Message + "'}");
                }
            }

        }

        public bool IsReusable
        {
            get
            {
                return false;
            }
        }
    }
}