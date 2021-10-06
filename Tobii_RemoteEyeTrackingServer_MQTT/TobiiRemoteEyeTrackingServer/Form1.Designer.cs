using System;

namespace TobiiRemoteEyeTrackingServer
{
    public partial class Form1
    {
        /// <summary>
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        /// Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {

                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        /// <summary>
        /// Required method for Designer support - do not modify
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            this.TrackerListComboBox = new System.Windows.Forms.ComboBox();
            this.CalibrateBtn = new System.Windows.Forms.Button();
            this.StreamBtn = new System.Windows.Forms.Button();
            this.label1 = new System.Windows.Forms.Label();
            this.MQTTIPTextBox = new System.Windows.Forms.TextBox();
            this.RealmTextbox = new System.Windows.Forms.TextBox();
            this.DisplayComboBox = new System.Windows.Forms.ComboBox();
            this.label3 = new System.Windows.Forms.Label();
            this.CalibrationPanel = new System.Windows.Forms.Panel();
            this.label4 = new System.Windows.Forms.Label();
            this.WAMPPanel = new System.Windows.Forms.Panel();
            this.label5 = new System.Windows.Forms.Label();
            this.label2 = new System.Windows.Forms.Label();
            this.FindTrackersBtn = new System.Windows.Forms.Button();
            this.label6 = new System.Windows.Forms.Label();
            this.FrequencyComboBox = new System.Windows.Forms.ComboBox();
            this.label7 = new System.Windows.Forms.Label();
            this.ModeComboBox = new System.Windows.Forms.ComboBox();
            this.BatchSizeComboBox = new System.Windows.Forms.ComboBox();
            this.label8 = new System.Windows.Forms.Label();
            this.label9 = new System.Windows.Forms.Label();
            this.thresholdTxtBox = new System.Windows.Forms.TextBox();
            this.CalibrationPanel.SuspendLayout();
            this.WAMPPanel.SuspendLayout();
            this.SuspendLayout();
            // 
            // TrackerListComboBox
            // 
            this.TrackerListComboBox.FormattingEnabled = true;
            this.TrackerListComboBox.Location = new System.Drawing.Point(118, 12);
            this.TrackerListComboBox.Name = "TrackerListComboBox";
            this.TrackerListComboBox.Size = new System.Drawing.Size(307, 21);
            this.TrackerListComboBox.TabIndex = 1;
            this.TrackerListComboBox.SelectedIndexChanged += new System.EventHandler(this.TrackerListComboBox_SelectedIndexChanged);
            // 
            // CalibrateBtn
            // 
            this.CalibrateBtn.Location = new System.Drawing.Point(155, 61);
            this.CalibrateBtn.Name = "CalibrateBtn";
            this.CalibrateBtn.Size = new System.Drawing.Size(100, 23);
            this.CalibrateBtn.TabIndex = 2;
            this.CalibrateBtn.Text = "Calibrate";
            this.CalibrateBtn.UseVisualStyleBackColor = true;
            this.CalibrateBtn.Click += new System.EventHandler(this.CalibrateBtn_Click);
            // 
            // StreamBtn
            // 
            this.StreamBtn.Location = new System.Drawing.Point(156, 54);
            this.StreamBtn.Name = "StreamBtn";
            this.StreamBtn.Size = new System.Drawing.Size(100, 24);
            this.StreamBtn.TabIndex = 3;
            this.StreamBtn.Text = "Stream";
            this.StreamBtn.UseVisualStyleBackColor = true;
            this.StreamBtn.Click += new System.EventHandler(this.StreamBtn_Click);
            // 
            // label1
            // 
            this.label1.AutoSize = true;
            this.label1.Location = new System.Drawing.Point(10, 31);
            this.label1.Name = "label1";
            this.label1.Size = new System.Drawing.Size(79, 13);
            this.label1.TabIndex = 4;
            this.label1.Text = "MQTT Address";
            // 
            // MQTTIPTextBox
            // 
            this.MQTTIPTextBox.Location = new System.Drawing.Point(121, 28);
            this.MQTTIPTextBox.Name = "MQTTIPTextBox";
            this.MQTTIPTextBox.Size = new System.Drawing.Size(270, 20);
            this.MQTTIPTextBox.TabIndex = 6;
            this.MQTTIPTextBox.Text = "localhost/mqtt";
            this.MQTTIPTextBox.TextChanged += new System.EventHandler(this.MQTTIPTextBox_TextChanged);
            // 
            // RealmTextbox
            // 
            this.RealmTextbox.Location = new System.Drawing.Point(0, 0);
            this.RealmTextbox.Margin = new System.Windows.Forms.Padding(2);
            this.RealmTextbox.Name = "RealmTextbox";
            this.RealmTextbox.Size = new System.Drawing.Size(76, 20);
            this.RealmTextbox.TabIndex = 14;
            // 
            // DisplayComboBox
            // 
            this.DisplayComboBox.FormattingEnabled = true;
            this.DisplayComboBox.Location = new System.Drawing.Point(106, 34);
            this.DisplayComboBox.Name = "DisplayComboBox";
            this.DisplayComboBox.Size = new System.Drawing.Size(291, 21);
            this.DisplayComboBox.TabIndex = 8;
            this.DisplayComboBox.SelectedIndexChanged += new System.EventHandler(this.DisplayComboBox_SelectedIndexChanged);
            // 
            // label3
            // 
            this.label3.AutoSize = true;
            this.label3.Location = new System.Drawing.Point(9, 37);
            this.label3.Name = "label3";
            this.label3.Size = new System.Drawing.Size(46, 13);
            this.label3.TabIndex = 9;
            this.label3.Text = "Displays";
            // 
            // CalibrationPanel
            // 
            this.CalibrationPanel.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
            this.CalibrationPanel.Controls.Add(this.label4);
            this.CalibrationPanel.Controls.Add(this.CalibrateBtn);
            this.CalibrationPanel.Controls.Add(this.DisplayComboBox);
            this.CalibrationPanel.Controls.Add(this.label3);
            this.CalibrationPanel.Location = new System.Drawing.Point(12, 200);
            this.CalibrationPanel.Name = "CalibrationPanel";
            this.CalibrationPanel.Size = new System.Drawing.Size(413, 105);
            this.CalibrationPanel.TabIndex = 10;
            // 
            // label4
            // 
            this.label4.AutoSize = true;
            this.label4.Font = new System.Drawing.Font("Microsoft Sans Serif", 9.75F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.label4.Location = new System.Drawing.Point(169, 15);
            this.label4.Name = "label4";
            this.label4.Size = new System.Drawing.Size(72, 16);
            this.label4.TabIndex = 10;
            this.label4.Text = "Calibration";
            // 
            // WAMPPanel
            // 
            this.WAMPPanel.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
            this.WAMPPanel.Controls.Add(this.label5);
            this.WAMPPanel.Controls.Add(this.MQTTIPTextBox);
            this.WAMPPanel.Controls.Add(this.label2);
            this.WAMPPanel.Controls.Add(this.RealmTextbox);
            this.WAMPPanel.Controls.Add(this.label1);
            this.WAMPPanel.Controls.Add(this.StreamBtn);
            this.WAMPPanel.Location = new System.Drawing.Point(12, 311);
            this.WAMPPanel.Name = "WAMPPanel";
            this.WAMPPanel.Size = new System.Drawing.Size(413, 91);
            this.WAMPPanel.TabIndex = 11;
            this.WAMPPanel.Paint += new System.Windows.Forms.PaintEventHandler(this.WAMPPanel_Paint);
            // 
            // label5
            // 
            this.label5.AutoSize = true;
            this.label5.Font = new System.Drawing.Font("Microsoft Sans Serif", 9.75F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.label5.Location = new System.Drawing.Point(169, 9);
            this.label5.Name = "label5";
            this.label5.Size = new System.Drawing.Size(47, 16);
            this.label5.TabIndex = 12;
            this.label5.Text = "MQTT";
            // 
            // label2
            // 
            this.label2.Location = new System.Drawing.Point(0, 0);
            this.label2.Margin = new System.Windows.Forms.Padding(2, 0, 2, 0);
            this.label2.Name = "label2";
            this.label2.Size = new System.Drawing.Size(75, 19);
            this.label2.TabIndex = 13;
            // 
            // FindTrackersBtn
            // 
            this.FindTrackersBtn.Location = new System.Drawing.Point(12, 12);
            this.FindTrackersBtn.Name = "FindTrackersBtn";
            this.FindTrackersBtn.Size = new System.Drawing.Size(100, 21);
            this.FindTrackersBtn.TabIndex = 0;
            this.FindTrackersBtn.Text = "Find All Trackers";
            this.FindTrackersBtn.UseVisualStyleBackColor = true;
            this.FindTrackersBtn.Click += new System.EventHandler(this.FindTrackersBtn_Click);
            // 
            // label6
            // 
            this.label6.AutoSize = true;
            this.label6.Location = new System.Drawing.Point(268, 111);
            this.label6.Name = "label6";
            this.label6.Size = new System.Drawing.Size(57, 13);
            this.label6.TabIndex = 12;
            this.label6.Text = "Frequency";
            // 
            // FrequencyComboBox
            // 
            this.FrequencyComboBox.FormattingEnabled = true;
            this.FrequencyComboBox.Location = new System.Drawing.Point(331, 108);
            this.FrequencyComboBox.Name = "FrequencyComboBox";
            this.FrequencyComboBox.Size = new System.Drawing.Size(94, 21);
            this.FrequencyComboBox.TabIndex = 13;
            this.FrequencyComboBox.SelectedIndexChanged += new System.EventHandler(this.FrequencyComboBox_SelectedIndexChanged);
            // 
            // label7
            // 
            this.label7.AutoSize = true;
            this.label7.Location = new System.Drawing.Point(264, 59);
            this.label7.Name = "label7";
            this.label7.Size = new System.Drawing.Size(34, 13);
            this.label7.TabIndex = 14;
            this.label7.Text = "Mode";
            this.label7.Click += new System.EventHandler(this.label7_Click);
            // 
            // ModeComboBox
            // 
            this.ModeComboBox.FormattingEnabled = true;
            this.ModeComboBox.Location = new System.Drawing.Point(304, 56);
            this.ModeComboBox.Name = "ModeComboBox";
            this.ModeComboBox.Size = new System.Drawing.Size(121, 21);
            this.ModeComboBox.TabIndex = 15;
            this.ModeComboBox.SelectedIndexChanged += new System.EventHandler(this.ModeComboBox_SelectedIndexChanged);
            // 
            // BatchSizeComboBox
            // 
            this.BatchSizeComboBox.FormattingEnabled = true;
            this.BatchSizeComboBox.Location = new System.Drawing.Point(331, 139);
            this.BatchSizeComboBox.Name = "BatchSizeComboBox";
            this.BatchSizeComboBox.Size = new System.Drawing.Size(94, 21);
            this.BatchSizeComboBox.TabIndex = 16;
            this.BatchSizeComboBox.SelectedIndexChanged += new System.EventHandler(this.BatchSizeComboBox_SelectedIndexChanged);
            // 
            // label8
            // 
            this.label8.AutoSize = true;
            this.label8.Location = new System.Drawing.Point(268, 142);
            this.label8.Name = "label8";
            this.label8.Size = new System.Drawing.Size(56, 13);
            this.label8.TabIndex = 17;
            this.label8.Text = "Batch size";
            this.label8.Click += new System.EventHandler(this.label8_Click);
            // 
            // label9
            // 
            this.label9.AutoSize = true;
            this.label9.Location = new System.Drawing.Point(184, 174);
            this.label9.Name = "label9";
            this.label9.Size = new System.Drawing.Size(141, 13);
            this.label9.TabIndex = 17;
            this.label9.Text = "Threshold (degrees/second)";
            this.label9.Click += new System.EventHandler(this.label8_Click);
            // 
            // thresholdTxtBox
            // 
            this.thresholdTxtBox.Location = new System.Drawing.Point(331, 171);
            this.thresholdTxtBox.Name = "thresholdTxtBox";
            this.thresholdTxtBox.Size = new System.Drawing.Size(94, 20);
            this.thresholdTxtBox.TabIndex = 6;
            this.thresholdTxtBox.TextChanged += new System.EventHandler(this.ThresholdTxtBox_TextChanged);
            // 
            // Form1
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(437, 474);
            this.Controls.Add(this.label9);
            this.Controls.Add(this.thresholdTxtBox);
            this.Controls.Add(this.label8);
            this.Controls.Add(this.BatchSizeComboBox);
            this.Controls.Add(this.ModeComboBox);
            this.Controls.Add(this.label7);
            this.Controls.Add(this.FrequencyComboBox);
            this.Controls.Add(this.label6);
            this.Controls.Add(this.WAMPPanel);
            this.Controls.Add(this.CalibrationPanel);
            this.Controls.Add(this.TrackerListComboBox);
            this.Controls.Add(this.FindTrackersBtn);
            this.Name = "Form1";
            this.Text = "Form1";
            this.Load += new System.EventHandler(this.Form1_Load);
            this.CalibrationPanel.ResumeLayout(false);
            this.CalibrationPanel.PerformLayout();
            this.WAMPPanel.ResumeLayout(false);
            this.WAMPPanel.PerformLayout();
            this.ResumeLayout(false);
            this.PerformLayout();

        }


        #endregion
        private System.Windows.Forms.ComboBox TrackerListComboBox;
        private System.Windows.Forms.Button CalibrateBtn;
        private System.Windows.Forms.Button StreamBtn;
        private System.Windows.Forms.Label label1;
        private System.Windows.Forms.TextBox MQTTIPTextBox;
        private System.Windows.Forms.TextBox RealmTextbox;
        private System.Windows.Forms.ComboBox DisplayComboBox;
        private System.Windows.Forms.Label label3;
        private System.Windows.Forms.Panel CalibrationPanel;
        private System.Windows.Forms.Label label4;
        private System.Windows.Forms.Panel WAMPPanel;
        private System.Windows.Forms.Label label5;
        private System.Windows.Forms.Button FindTrackersBtn;
        private System.Windows.Forms.Label label6;
        private System.Windows.Forms.ComboBox FrequencyComboBox;
        private System.Windows.Forms.Label label7;
        private System.Windows.Forms.ComboBox ModeComboBox;
        private System.Windows.Forms.Label label2;
        private System.Windows.Forms.ComboBox BatchSizeComboBox;
        private System.Windows.Forms.Label label8;
        private System.Windows.Forms.Label label9;
        private System.Windows.Forms.TextBox thresholdTxtBox;
    }
}

