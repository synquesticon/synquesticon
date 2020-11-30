using System.Drawing;
using System.Linq;
using System.Threading;
using System.Windows.Forms;

using System;

using Tobii.Research;
//using Tobii.Research.Addons;

using System.Collections.Concurrent;
using MQTTnet;
using MQTTnet.Client.Options;
using Newtonsoft.Json;
using System.Collections.Generic;

//Install-Package WampSharp.Default -Pre

namespace TobiiRemoteEyeTrackingServer
{
    public class StandardJsonConverter : JsonConverter
    {
        public override bool CanRead
        {
            get
            {
                return false;
            }
        }
        public override bool CanWrite
        {
            get
            {
                return true;
            }
        }
        public override void WriteJson(JsonWriter writer, object value, JsonSerializer serializer)
        {
            if (value == null)
            {
                writer.WriteNull();
                return;
            }

            var val = Convert.ToDouble(value);
            if (Double.IsNaN(val) || Double.IsInfinity(val))
            {
                writer.WriteNull();
                return;
            }
            // Preserve the type, otherwise values such as 3.14f may suddenly be
            // printed as 3.1400001049041748.
            if (value is float)
                writer.WriteValue((float)value);
            else
                writer.WriteValue((double)value);
        }
        public override object ReadJson(JsonReader reader, Type objectType, object existingValue, JsonSerializer serializer)
        {
            throw new NotImplementedException();
        }
        public override bool CanConvert(Type objectType)
        {
            return objectType == typeof(double) || objectType == typeof(float);
        }
    }
    public partial class Form1 : Form
    {
        private EyeTrackerCollection AvailableTrackers;
        public Form1()
        {
            InitializeComponent();
        }

        private void FindTrackersBtn_Click(object sender, EventArgs e)
        {
            FillInAvailableTrackers();
        }

        private void CalibrateBtn_Click(object sender, EventArgs e)
        {
            try
            {
                //create calibration interface
                NormalizedPoint2D[] pointsToCalibrate = new NormalizedPoint2D[] {
                    new NormalizedPoint2D(0.5f, 0.5f),
                    new NormalizedPoint2D(0.1f, 0.1f),
                    new NormalizedPoint2D(0.1f, 0.9f),
                    new NormalizedPoint2D(0.9f, 0.1f),
                    new NormalizedPoint2D(0.9f, 0.9f),
                };
                Form CalibrationForm = CreateCalibrationForm(pointsToCalibrate);
                //CalibrationForm.Shown += (senderS, eS) =>
                //{
                //    System.Threading.Thread.Sleep(3000);
                //};

                IEyeTracker SelectedTracker = AvailableTrackers.ElementAt(TrackerListComboBox.SelectedIndex);
                CalibrationForm.KeyPress += (keySender, keyEvent) =>
                {
                    if (keyEvent.KeyChar == ' ')
                    {
                        Calibrate(CalibrationForm, SelectedTracker);
                    }
                };



                CalibrationForm.Show();

            }
            catch (Exception exp)
            {
                //do nothing
                Console.Write(exp);
            }
        }

        private Form CreateCalibrationForm(NormalizedPoint2D[] pointsToDraw)
        {
            Form CalibrationForm = new Form();
            CalibrationForm.ControlBox = false;
            CalibrationForm.WindowState = FormWindowState.Maximized;
            //CalibrationForm.Paint += (sender, e) => {
            //    SolidBrush CalBrush = new SolidBrush(Color.Red);
            //    int radius = 25;
            //    int w = CalibrationForm.Width;
            //    int h = CalibrationForm.Height;
            //    foreach (var point in pointsToDraw)
            //    {
            //        e.Graphics.FillEllipse(CalBrush, point.X*w - radius, point.Y*h - radius,
            //          radius + radius, radius + radius);
            //    }
            //};

            return CalibrationForm;
        }
        private Pen CalBrush = new Pen(Color.ForestGreen, 10f);
        private void DrawPointOnForm(Graphics g, int w, int h, NormalizedPoint2D point)
        {
            int radius = 30;
            g.DrawEllipse(CalBrush, point.X * w - radius, point.Y * h - radius,
                      radius + radius, radius + radius);
        }

        private void MovingPoint(Graphics g, int w, int h, NormalizedPoint2D from, NormalizedPoint2D to)
        {
            float fromX = from.X * w;
            float fromY = from.Y * h;
            float toX = to.X * w;
            float toY = to.Y * h;
            float tempX = fromX;
            float tempY = fromY;
            float movingIntervalX = (toX - fromX) / 80;
            float movingIntervalY = (toY - fromY) / 80;
            int radius = 30;
            while ((toX - tempX)*movingIntervalX > 0 || (toY - tempY) * movingIntervalY > 0)
            {
                g.Clear(Color.White);
                g.DrawEllipse(CalBrush, tempX - radius, tempY - radius,
                      radius + radius, radius + radius);
                System.Threading.Thread.Sleep(10);
                tempX += movingIntervalX;
                tempY += movingIntervalY;
            }
            g.Clear(Color.White);
            g.DrawEllipse(CalBrush, toX - radius, toY - radius,
                  radius + radius, radius + radius);
        }

        private void Calibrate(Form CalibrationForm, IEyeTracker eyeTracker)
        {
            // Define the points on screen we should calibrate at.
            // The coordinates are normalized, i.e. (0.0f, 0.0f) is the upper left corner and (1.0f, 1.0f) is the lower right corner.
            var pointsToCalibrate = new NormalizedPoint2D[] {
                new NormalizedPoint2D(0.5f, 0.5f),
                new NormalizedPoint2D(0.1f, 0.1f),
                new NormalizedPoint2D(0.1f, 0.9f),
                new NormalizedPoint2D(0.9f, 0.1f),
                new NormalizedPoint2D(0.9f, 0.9f),
            };

            //eyeTracker.CalibrationChanged += (cSender, cE) =>
            //{
            //    var calibrationValidation = new ScreenBasedCalibrationValidation(eyeTracker);
            //    calibrationValidation.EnterValidationMode();

            //    foreach (var point in pointsToCalibrate)
            //    {
            //        Console.WriteLine("Collecting for point {0}, {1}", point.X, point.Y);

            //        calibrationValidation.StartCollectingData(point);
            //        while (calibrationValidation.State == ScreenBasedCalibrationValidation.ValidationState.CollectingData)
            //        {
            //            System.Threading.Thread.Sleep(25);
            //        }
            //    }

            //    var result = calibrationValidation.Compute();
            //    Console.WriteLine(calibrationValidation);
            //    calibrationValidation.LeaveValidationMode();
                
            //};

            // Create a calibration object.
            var calibration = new ScreenBasedCalibration(eyeTracker);
            // Enter calibration mode.
            calibration.EnterCalibrationMode();

            // Collect data.

            Panel AnimatedPointPanel = new Panel();
            AnimatedPointPanel.Width = CalibrationForm.Width;
            AnimatedPointPanel.Height = CalibrationForm.Height;
            Graphics AnimatedPointGraphics = AnimatedPointPanel.CreateGraphics();
            CalibrationForm.Controls.Add(AnimatedPointPanel);

            int w = CalibrationForm.Width;
            int h = CalibrationForm.Height;
            MovingPoint(AnimatedPointGraphics, w, h, new NormalizedPoint2D(0.5f, 0.1f), new NormalizedPoint2D(0.5f, 0.5f));
            for (int i = 0; i < pointsToCalibrate.Length; i++) 
            {
                var point = pointsToCalibrate[i];
                // Show an image on screen where you want to calibrate.
                DrawPointOnForm(AnimatedPointGraphics, w, h, point);
                Console.WriteLine("Show point on screen at ({0}, {1})", point.X, point.Y);
                // Wait a little for user to focus.
                System.Threading.Thread.Sleep(700);
                // Collect data.
                CalibrationStatus status = calibration.CollectData(point);
                if (status != CalibrationStatus.Success)
                {
                    // Try again if it didn't go well the first time.
                    // Not all eye tracker models will fail at this point, but instead fail on ComputeAndApply.
                    calibration.CollectData(point);
                }
                if(i + 1 < pointsToCalibrate.Length)
                {
                    MovingPoint(AnimatedPointGraphics, w, h, point, pointsToCalibrate[i + 1]);
                }
                
            }
            // Compute and apply the calibration.
            CalibrationResult calibrationResult = calibration.ComputeAndApply();
            Console.WriteLine("Compute and apply returned {0} and collected at {1} points.",
                calibrationResult.Status, calibrationResult.CalibrationPoints.Count);
            // Analyze the data and maybe remove points that weren't good.
            calibration.DiscardData(new NormalizedPoint2D(0.1f, 0.1f));
            // Redo collection at the discarded point.
            Console.WriteLine("Show point on screen at ({0}, {1})", 0.1f, 0.1f);
            calibration.CollectData(new NormalizedPoint2D(0.1f, 0.1f));
            // Compute and apply again.
            calibrationResult = calibration.ComputeAndApply();
            Console.WriteLine("Second compute and apply returned {0} and collected at {1} points.",
                calibrationResult.Status, calibrationResult.CalibrationPoints.Count);
            // See that you're happy with the result.
            // The calibration is done. Leave calibration mode.
            calibration.LeaveCalibrationMode();
            CalibrationForm.Close();
            
        }
        private Thread MQTTThread;
        private Guid guid = Guid.NewGuid();
        private string mqttTopic = "sensor/gaze/";
        private int recordingCount = 0;
        private bool IsStreamingMQTT = false;
        private IEyeTracker SelectedTracker = null;
        private ConcurrentQueue<GazeDataEventArgs> GazeEventQueue = new ConcurrentQueue<GazeDataEventArgs>();
        private double[] CurrentPupilDiameters = {0, 0 };
        async private void StreamBtn_Click(object sender, EventArgs e)
        {         
          
            if (!IsStreamingMQTT)
            {
                recordingCount++;
                
                long startTime = ((DateTimeOffset)DateTime.UtcNow).ToUnixTimeMilliseconds(); //current start time when we button is clicked

                var topic = mqttTopic;
                //+ guid.ToString();

                var factory = new MqttFactory();
                var mqttClient = factory.CreateMqttClient();
                // Create TCP based options using the builder.
                /*var options = new MqttClientOptionsBuilder()
                    .WithTcpServer("broker.hivemq.com")
                    .WithCredentials("bud", "%spencer%")
                    .WithCleanSession()
                    .Build();*/

                string mqttText = MQTTIPTextBox.Text;

                // Use WebSocket connection.
                var options = new MqttClientOptionsBuilder()
                    .WithClientId("Tobii RET")
                    .WithWebSocketServer(mqttText) //"broker.hivemq.com:8000/mqtt"
                    .WithTls() //For wss
                    .Build();
                await mqttClient.ConnectAsync(options, CancellationToken.None); // Since 3.0.5 with CancellationToken

                //TODO figure out how to setup the disconnect handler to reconnect as needed. 
                //The wiki seems to not be updated on this point
                /*mqttClient.UseDisconnectedHandler = (async e =>
                {
                    Console.WriteLine("### DISCONNECTED FROM SERVER ###");
                    await Task.Delay(TimeSpan.FromSeconds(5));

                    try
                    {
                        await mqttClient.ConnectAsync(options, CancellationToken.None); // Since 3.0.5 with CancellationToken
                    }
                    catch
                    {
                        Console.WriteLine("### RECONNECTING FAILED ###");
                    }
                });*/

                SelectedTracker.GazeDataReceived += HandleGazeData;
                IsStreamingMQTT = true;
                MQTTThread = new Thread(async () => {
                    int sampleCount = 0;
                    while(IsStreamingMQTT)
                    {
                        try
                        {
                            while (GazeEventQueue.Any())
                            {
                                GazeDataEventArgs gazeEvent;
                                GazeEventQueue.TryDequeue(out gazeEvent);
                                sampleCount++; //increase sample counts
                                float gazeX = 0;
                                float gazeY = 0;
                                if (gazeEvent.LeftEye.GazePoint.Validity == Validity.Valid &&
                                    gazeEvent.RightEye.GazePoint.Validity == Validity.Valid)
                                {
                                    gazeX = (gazeEvent.LeftEye.GazePoint.PositionOnDisplayArea.X + gazeEvent.RightEye.GazePoint.PositionOnDisplayArea.X) / 2;
                                    gazeY = (gazeEvent.LeftEye.GazePoint.PositionOnDisplayArea.Y + gazeEvent.RightEye.GazePoint.PositionOnDisplayArea.Y) / 2;
                                }
                                else if (gazeEvent.LeftEye.GazePoint.Validity == Validity.Valid)
                                {
                                    gazeX = gazeEvent.LeftEye.GazePoint.PositionOnDisplayArea.X;
                                    gazeY = gazeEvent.LeftEye.GazePoint.PositionOnDisplayArea.Y;
                                }
                                else if (gazeEvent.RightEye.GazePoint.Validity == Validity.Valid)
                                {
                                    gazeX = gazeEvent.RightEye.GazePoint.PositionOnDisplayArea.X;
                                    gazeY = gazeEvent.RightEye.GazePoint.PositionOnDisplayArea.Y;
                                }

                                if (gazeEvent.LeftEye.Pupil.PupilDiameter != -1 || gazeEvent.RightEye.Pupil.PupilDiameter != -1)
                                {
                                    CurrentPupilDiameters[0] = Double.IsNaN(gazeEvent.LeftEye.Pupil.PupilDiameter) ? -1 : gazeEvent.LeftEye.Pupil.PupilDiameter;
                                    CurrentPupilDiameters[1] = Double.IsNaN(gazeEvent.RightEye.Pupil.PupilDiameter) ? -1 : gazeEvent.RightEye.Pupil.PupilDiameter;
                                }

                                //create a dict-shape message, later will be serialized as a json object
                                var msg = new Dictionary<string, object>();
                                msg.Add("user", new Dictionary<string, Guid>
                                                {
                                                    {"uid", guid}
                                                }
                                );
                                msg.Add("eyeTrackerSerialNumber", SelectedTracker.SerialNumber);
                                // msg.Add("timestamp", ((DateTimeOffset)DateTime.UtcNow).ToUnixTimeMilliseconds());
                                msg.Add("timestamp", gazeEvent.DeviceTimeStamp);
                                msg.Add("startTime", startTime);
                                msg.Add("recordingCount", recordingCount);
                                msg.Add("sampleCount", sampleCount);
                                
                                
                                var dataList = new List<object>(); //for later adding object in
                                
                                var dataObject = new Dictionary<string, object>();
                                dataObject.Add("gaze", new Dictionary<string, float>
                                    {
                                        { "x", gazeX },
                                        { "y", gazeY }
                                    }
                                );
                                
                                dataObject.Add("pupilDiameter", new Dictionary<string, double>
                                    {
                                        { "LeftEye", CurrentPupilDiameters[0]},
                                        { "RightEye", CurrentPupilDiameters[1]}
                                    }
                                );
                                
                                //GazePoint in data
                                var GazePointObject = new Dictionary<string, object>();
                                GazePointObject.Add("LeftEye", new Dictionary<string, float>
                                    {
                                        { "x", float.IsNaN(gazeEvent.LeftEye.GazePoint.PositionOnDisplayArea.X) ? float.NaN : gazeEvent.LeftEye.GazePoint.PositionOnDisplayArea.X},
                                        { "y", float.IsNaN(gazeEvent.LeftEye.GazePoint.PositionOnDisplayArea.Y) ? float.NaN : gazeEvent.LeftEye.GazePoint.PositionOnDisplayArea.Y }
                                    }
                                );

                                GazePointObject.Add("RightEye", new Dictionary<string, float>
                                    {
                                        { "x", float.IsNaN(gazeEvent.RightEye.GazePoint.PositionOnDisplayArea.X) ? float.NaN : gazeEvent.RightEye.GazePoint.PositionOnDisplayArea.X},
                                        { "y", float.IsNaN(gazeEvent.RightEye.GazePoint.PositionOnDisplayArea.Y) ? float.NaN : gazeEvent.RightEye.GazePoint.PositionOnDisplayArea.Y }
                                    }
                                );                                
                                dataObject.Add("GazePoint_PositionOnDisplayArea", GazePointObject);
                                
                                //GazeOrigin in data
                                var GazeOriginObject = new Dictionary<string, object>();
                                GazeOriginObject.Add("LeftEye", new Dictionary<string, float>
                                    {
                                        { "x", float.IsNaN(gazeEvent.LeftEye.GazeOrigin.PositionInUserCoordinates.X) ? float.NaN :  gazeEvent.LeftEye.GazeOrigin.PositionInUserCoordinates.X },
                                        { "y", float.IsNaN(gazeEvent.LeftEye.GazeOrigin.PositionInUserCoordinates.Y) ? float.NaN :  gazeEvent.LeftEye.GazeOrigin.PositionInUserCoordinates.Y },
                                        { "z", float.IsNaN(gazeEvent.LeftEye.GazeOrigin.PositionInUserCoordinates.Z) ? float.NaN :  gazeEvent.LeftEye.GazeOrigin.PositionInUserCoordinates.Z }
                                    }
                                );

                                GazeOriginObject.Add("RightEye", new Dictionary<string, float>
                                    {
                                        { "x", float.IsNaN(gazeEvent.RightEye.GazeOrigin.PositionInUserCoordinates.X) ? float.NaN :  gazeEvent.RightEye.GazeOrigin.PositionInUserCoordinates.X },
                                        { "y", float.IsNaN(gazeEvent.RightEye.GazeOrigin.PositionInUserCoordinates.Y) ? float.NaN :  gazeEvent.RightEye.GazeOrigin.PositionInUserCoordinates.Y },
                                        { "z", float.IsNaN(gazeEvent.RightEye.GazeOrigin.PositionInUserCoordinates.Z) ? float.NaN :  gazeEvent.RightEye.GazeOrigin.PositionInUserCoordinates.Z }
                                    }
                                );                                
                                dataObject.Add("GazeOrigin_PositionInUserCoordinates", GazeOriginObject);

                                dataList.Add(dataObject); //append to the list

                                msg.Add("data", dataList);


                                // string jsonMSG = JsonConvert.SerializeObject(msg);
                                

                                var settings = new JsonSerializerSettings();
                                var floatConverter = new StandardJsonConverter();
                                settings.Converters.Add(floatConverter);                              
                                string jsonMSG =  JsonConvert.SerializeObject(msg, settings);

                                
                                var message = new MqttApplicationMessageBuilder()
                                .WithTopic(topic)
                                .WithPayload(jsonMSG)
                                .WithExactlyOnceQoS()
                                .WithRetainFlag(false)
                                .Build();
                                mqttClient.PublishAsync(message, CancellationToken.None); // Since 3.0.5 with CancellationToken
                            }
                        }
                        catch (Exception exp)
                        {
                            //do nothing, skip
                            Console.Write(exp);
                        }
                        
                    }
                });
                MQTTThread.Start();

                if (StreamBtn.InvokeRequired)
                {
                    StreamBtn.BeginInvoke((MethodInvoker)delegate () { this.StreamBtn.Text = "Stop"; });
                }
                else
                {
                    StreamBtn.Text = "Stop";
                }
            }
            else
            {
                IsStreamingMQTT = false;
                SelectedTracker.GazeDataReceived -= HandleGazeData;
                if (StreamBtn.InvokeRequired)
                {
                    StreamBtn.BeginInvoke((MethodInvoker)delegate () { this.StreamBtn.Text = "Stream"; });
                }
                else
                {
                    StreamBtn.Text = "Stream";
                }
                MQTTThread.Join();
            }
        }

        private void HandleGazeData(object sender, GazeDataEventArgs gazeEvent)
        {
            try
            {
                if (gazeEvent.LeftEye.Pupil.Validity == Validity.Valid || gazeEvent.RightEye.Pupil.Validity == Validity.Valid)
                {
                    GazeEventQueue.Enqueue(gazeEvent);
                }

            }
            catch (Exception exp)
            {
                Console.Write(exp);
            }
        }

        private void Form1_Load(object sender, EventArgs e)
        {
            FillInAvailableTrackers();

            foreach (var screen in Screen.AllScreens)
            {
                DisplayComboBox.Items.Add(screen.DeviceName);
            }

            DisplayComboBox.SelectedIndex = 0;
        }

        private void FillInAvailableTrackers()
        {
            try
            {
                AvailableTrackers = EyeTrackingOperations.FindAllEyeTrackers();
                foreach (IEyeTracker eyeTracker in AvailableTrackers)
                {
                    if (!TrackerListComboBox.Items.Contains(eyeTracker.SerialNumber))
                    {
                        TrackerListComboBox.Items.Add(eyeTracker.SerialNumber);
                    } 
                }
                TrackerListComboBox.SelectedIndex = 0;

                CalibrationPanel.Enabled = (AvailableTrackers.Count > 0);
                WAMPPanel.Enabled = (AvailableTrackers.Count > 0);
                SelectedTracker = AvailableTrackers.ElementAt(TrackerListComboBox.SelectedIndex);
            }
            catch (Exception exp)
            {
                SelectedTracker = null;
                Console.Write(exp);
            }
        }

        private void DisplayComboBox_SelectedIndexChanged(object sender, EventArgs e)
        {
            try
            {
                SelectedTracker = AvailableTrackers.ElementAt(TrackerListComboBox.SelectedIndex);
                //SelectedTracker.
            }
            catch (Exception exp)
            {
                SelectedTracker = null;
                Console.Write(exp);
            }
        }

        private void TrackerListComboBox_SelectedIndexChanged(object sender, EventArgs e)
        {
            try
            {
                SelectedTracker = AvailableTrackers.ElementAt(TrackerListComboBox.SelectedIndex);
                foreach (var fre in SelectedTracker.GetAllGazeOutputFrequencies())
                {
                    FrequencyComboBox.Items.Add(fre.ToString());
                }
                FrequencyComboBox.SelectedIndex = 0;

                foreach (var mode in SelectedTracker.GetAllEyeTrackingModes())
                {
                    ModeComboBox.Items.Add(mode.ToString());
                }
                ModeComboBox.SelectedIndex = 0;
            }
            catch (Exception exp)
            {
                SelectedTracker = null;
                Console.Write(exp);
            }
        }

        private void FrequencyComboBox_SelectedIndexChanged(object sender, EventArgs e)
        {
            try
            {
                foreach (var fre in SelectedTracker.GetAllGazeOutputFrequencies())
                {
                    if (FrequencyComboBox.SelectedValue.Equals(fre.ToString()))
                    {
                        SelectedTracker.SetGazeOutputFrequency(fre);
                        break;
                    }
                }
            }
            catch (Exception exp)
            {
                Console.Write(exp);
            }
        }

        private void ModeComboBox_SelectedIndexChanged(object sender, EventArgs e)
        {
            try
            {
                foreach (var mode in SelectedTracker.GetAllEyeTrackingModes())
                {
                    if (ModeComboBox.SelectedValue.Equals(mode.ToString()))
                    {
                        SelectedTracker.SetEyeTrackingMode(mode);
                        break;
                    }
                }
            }
            catch (Exception exp)
            {
                Console.Write(exp);
            }
        }
    }
}
