using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Tobii.Research;

namespace TobiiRemoteEyeTrackingServer
{
    public static class VelocityCalculation
    {
        public static double CalculateVelocity(GazeDataEventArgs prevGaze, GazeDataEventArgs currentGaze, String option)
        {
            double velocity = 0;

            if(prevGaze == null)
            {
                return velocity;
            }

            double visualAngleDegrees = 0;

            if (option.Equals("Average"))
            {
                Point3D prevAveragePoint3D = GetAveragePoint(prevGaze);
                Point3D currentAveragePoint3D = GetAveragePoint(currentGaze);
                visualAngleDegrees = GetVisualAngle(prevAveragePoint3D, currentAveragePoint3D);
                Console.Write("------ Visual angle ");
                Console.WriteLine(visualAngleDegrees);
            }             

            double durationSeconds = (currentGaze.DeviceTimeStamp - prevGaze.DeviceTimeStamp) / 1000000d;

            if (durationSeconds > 0d)
            {
                velocity = visualAngleDegrees / durationSeconds;
            }
            return velocity;
        }

        private static Point3D GetAveragePoint(GazeDataEventArgs gazeEvent)
        {
            float gazeX = 0;
            float gazeY = 0;
            float gazeZ = 0;
            if (gazeEvent.LeftEye.GazePoint.Validity == Validity.Valid &&
                                    gazeEvent.RightEye.GazePoint.Validity == Validity.Valid)
            {
                gazeX = (gazeEvent.LeftEye.GazePoint.PositionInUserCoordinates.X + gazeEvent.RightEye.GazePoint.PositionInUserCoordinates.X) / 2;
                gazeY = (gazeEvent.LeftEye.GazePoint.PositionInUserCoordinates.Y + gazeEvent.RightEye.GazePoint.PositionInUserCoordinates.Y) / 2;
                gazeY = (gazeEvent.LeftEye.GazePoint.PositionInUserCoordinates.Z + gazeEvent.RightEye.GazePoint.PositionInUserCoordinates.Z) / 2;
            }
            else if (gazeEvent.LeftEye.GazePoint.Validity == Validity.Valid)
            {
                gazeX = gazeEvent.LeftEye.GazePoint.PositionInUserCoordinates.X;
                gazeY = gazeEvent.LeftEye.GazePoint.PositionInUserCoordinates.Y;
                gazeZ = gazeEvent.LeftEye.GazePoint.PositionInUserCoordinates.Y;
            }
            else if (gazeEvent.RightEye.GazePoint.Validity == Validity.Valid)
            {
                gazeX = gazeEvent.RightEye.GazePoint.PositionInUserCoordinates.X;
                gazeY = gazeEvent.RightEye.GazePoint.PositionInUserCoordinates.Y;
                gazeZ = gazeEvent.RightEye.GazePoint.PositionInUserCoordinates.Y;
            }

            return (new Point3D(gazeX, gazeY, gazeZ));
        }

        private static double GetVisualAngle(Point3D prevPoint, Point3D currentPoint)
        {
            double angleDeg = 0;
            var fromVector = GetNormalizedVector(prevPoint);
            var toVector = GetNormalizedVector(currentPoint);

            double angleRad = GetAngle(fromVector, toVector);

            // convert radians to degrees
            angleDeg = ConvertRadToDeg(angleRad);

            // convert angle to positive value
            return WrapAround(angleDeg, 360);
        }

        private static double GetAngle(Point3D source, Point3D target)
        {
            double cosine = DotProduct(source, target) / (GetLength(source) * GetLength(target));

            // ensure the value is in the <-1,1> interval
            cosine = Math.Min(1, Math.Max(-1, cosine));

            // return the angle for the cosine value in radians
            return Math.Acos(cosine);
        }

        public static double WrapAround(double value, double modulo)
        {
            return (value + modulo) % modulo;
        }

        public static double ConvertRadToDeg(double angle)
        {
            return angle * (180d / Math.PI);
        }

        public static double DotProduct(Point3D left, Point3D right)
        {
            return left.X * right.X
                 + left.Y * right.Y
                 + left.Z * right.Z;
        }

        private static Point3D GetNormalizedVector(Point3D vector)
        {
            float length = GetLength(vector);
            Point3D normedVector = new Point3D(vector.X / length, vector.Y / length, vector.Z / length);
            return normedVector;
        }

        public static float GetLength(Point3D vector)
        {
            return (float)Math.Sqrt
            (
                Math.Pow(vector.X, 2)
              + Math.Pow(vector.Y, 2)
              + Math.Pow(vector.Z, 2)
            );
        }
    }
}
