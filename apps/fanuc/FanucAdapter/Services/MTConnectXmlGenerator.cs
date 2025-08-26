using System.Diagnostics;
using System.Xml.Linq;

namespace FanucAdapter.Services;

public class MTConnectXmlGenerator
{
    private static readonly XNamespace ns = "urn:mtconnect.org:MTConnectStreams:1.2";
    private static readonly XNamespace m = "urn:mtconnect.org:MTConnectStreams:1.2";
    private static readonly XNamespace xsi = "http://www.w3.org/2001/XMLSchema-instance";
    
    private static long _sequenceNumber = 1;
    
    public static XDocument GenerateMTConnectStreams(MachineData machineData)
    {
        var timestamp = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ");
        
        var doc = new XDocument(
            new XElement(ns + "MTConnectStreams",
                new XAttribute(XNamespace.Xmlns + "m", m),
                new XAttribute("xmlns", ns),
                new XAttribute(XNamespace.Xmlns + "xsi", xsi),
                new XAttribute(xsi + "schemaLocation", 
                    "urn:mtconnect.org:MTConnectStreams:1.2 /schemas/MTConnectStreams_1.2.xsd"),
                
                CreateHeader(machineData.MachineName),
                CreateStreams(machineData, timestamp)
            )
        );
        
        return doc;
    }
    
    private static XElement CreateHeader(string sender)
    {
        return new XElement(ns + "Header",
            new XAttribute("creationTime", DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ")),
            new XAttribute("sender", sender),
            new XAttribute("instanceId", Process.GetCurrentProcess().Id.ToString()),
            new XAttribute("version", "1.2.0.22"),
            new XAttribute("bufferSize", "4096"),
            new XAttribute("nextSequence", (_sequenceNumber + 1).ToString()),
            new XAttribute("firstSequence", "1"),
            new XAttribute("lastSequence", _sequenceNumber.ToString())
        );
    }
    
    private static XElement CreateStreams(MachineData data, string timestamp)
    {
        var deviceStream = new XElement(ns + "DeviceStream",
            new XAttribute("name", data.MachineName),
            new XAttribute("uuid", data.Uuid ?? Guid.NewGuid().ToString())
        );
        
        deviceStream.Add(CreateControllerStream(data, timestamp));
        deviceStream.Add(CreatePathStream(data, timestamp));
        deviceStream.Add(CreateAxesStream(data, timestamp));
        
        var linearAxes = CreateLinearAxes(data, timestamp);
        foreach (var axis in linearAxes)
        {
            deviceStream.Add(axis);
        }
        
        deviceStream.Add(CreateSpindleStream(data, timestamp));
        deviceStream.Add(CreateDeviceStream(data, timestamp));
        
        return new XElement(ns + "Streams", deviceStream);
    }
    
    private static XElement CreateControllerStream(MachineData data, string timestamp)
    {
        var controllerStream = new XElement(ns + "ComponentStream",
            new XAttribute("component", "Controller"),
            new XAttribute("name", "controller"),
            new XAttribute("componentId", "cont")
        );
        
        var events = new XElement(ns + "Events");
        
        if (!string.IsNullOrEmpty(data.EmergencyStop))
        {
            events.Add(new XElement(ns + "EmergencyStop",
                new XAttribute("dataItemId", "estop"),
                new XAttribute("timestamp", timestamp),
                new XAttribute("name", "estop"),
                new XAttribute("sequence", (++_sequenceNumber).ToString()),
                data.EmergencyStop
            ));
        }
        
        if (events.HasElements)
            controllerStream.Add(events);
        
        var conditions = new XElement(ns + "Condition");
        
        if (!string.IsNullOrEmpty(data.ConnectionStatus))
        {
            var conditionType = data.ConnectionStatus == "CONNECTED" ? "Normal" : "Fault";
            conditions.Add(new XElement(ns + conditionType,
                new XAttribute("dataItemId", "ccond"),
                new XAttribute("timestamp", timestamp),
                new XAttribute("name", "comms_cond"),
                new XAttribute("sequence", (++_sequenceNumber).ToString()),
                new XAttribute("type", "COMMUNICATIONS")
            ));
        }
        
        conditions.Add(new XElement(ns + "Normal",
            new XAttribute("dataItemId", "system"),
            new XAttribute("timestamp", timestamp),
            new XAttribute("name", "system_cond"),
            new XAttribute("sequence", (++_sequenceNumber).ToString()),
            new XAttribute("type", "SYSTEM")
        ));
        
        if (conditions.HasElements)
            controllerStream.Add(conditions);
        
        return controllerStream;
    }
    
    private static XElement CreatePathStream(MachineData data, string timestamp)
    {
        var pathStream = new XElement(ns + "ComponentStream",
            new XAttribute("component", "Path"),
            new XAttribute("name", "path"),
            new XAttribute("componentId", "path1")
        );
        
        var events = new XElement(ns + "Events");
        
        if (!string.IsNullOrEmpty(data.ExecutionStatus))
        {
            events.Add(new XElement(ns + "Execution",
                new XAttribute("dataItemId", "exec"),
                new XAttribute("timestamp", timestamp),
                new XAttribute("name", "execution"),
                new XAttribute("sequence", (++_sequenceNumber).ToString()),
                MapExecutionStatus(data.ExecutionStatus)
            ));
        }
        
        if (!string.IsNullOrEmpty(data.ControllerMode))
        {
            events.Add(new XElement(ns + "ControllerMode",
                new XAttribute("dataItemId", "mode"),
                new XAttribute("timestamp", timestamp),
                new XAttribute("name", "mode"),
                new XAttribute("sequence", (++_sequenceNumber).ToString()),
                MapControllerMode(data.ControllerMode)
            ));
        }
        
        if (!string.IsNullOrEmpty(data.ProgramName))
        {
            events.Add(new XElement(ns + "Program",
                new XAttribute("dataItemId", "pgm"),
                new XAttribute("timestamp", timestamp),
                new XAttribute("name", "program"),
                new XAttribute("sequence", (++_sequenceNumber).ToString()),
                data.ProgramName
            ));
        }
        
        if (data.PartCount.HasValue)
        {
            events.Add(new XElement(ns + "PartCount",
                new XAttribute("dataItemId", "pc"),
                new XAttribute("timestamp", timestamp),
                new XAttribute("name", "PartCountAct"),
                new XAttribute("sequence", (++_sequenceNumber).ToString()),
                data.PartCount.Value.ToString()
            ));
        }
        
        if (data.LineNumber.HasValue)
        {
            events.Add(new XElement(ns + "Line",
                new XAttribute("dataItemId", "ln"),
                new XAttribute("timestamp", timestamp),
                new XAttribute("name", "line"),
                new XAttribute("sequence", (++_sequenceNumber).ToString()),
                data.LineNumber.Value.ToString()
            ));
        }
        
        if (events.HasElements)
            pathStream.Add(events);
        
        var samples = new XElement(ns + "Samples");
        
        if (data.FeedRate.HasValue)
        {
            samples.Add(new XElement(ns + "PathFeedrate",
                new XAttribute("dataItemId", "pf"),
                new XAttribute("timestamp", timestamp),
                new XAttribute("name", "Fact"),
                new XAttribute("sequence", (++_sequenceNumber).ToString()),
                new XAttribute("subType", "ACTUAL"),
                data.FeedRate.Value.ToString()
            ));
        }
        
        if (data.FeedOverride.HasValue)
        {
            samples.Add(new XElement(ns + "PathFeedrate",
                new XAttribute("dataItemId", "pfo"),
                new XAttribute("timestamp", timestamp),
                new XAttribute("name", "Fovr"),
                new XAttribute("sequence", (++_sequenceNumber).ToString()),
                new XAttribute("subType", "OVERRIDE"),
                data.FeedOverride.Value.ToString()
            ));
        }
        
        if (samples.HasElements)
            pathStream.Add(samples);
        
        return pathStream;
    }
    
    private static XElement CreateAxesStream(MachineData data, string timestamp)
    {
        var axesStream = new XElement(ns + "ComponentStream",
            new XAttribute("component", "Axes"),
            new XAttribute("name", "base"),
            new XAttribute("componentId", "a")
        );
        
        var conditions = new XElement(ns + "Condition");
        conditions.Add(new XElement(ns + "Normal",
            new XAttribute("dataItemId", "servo"),
            new XAttribute("timestamp", timestamp),
            new XAttribute("name", "servo_cond"),
            new XAttribute("sequence", (++_sequenceNumber).ToString()),
            new XAttribute("type", "ACTUATOR")
        ));
        
        axesStream.Add(conditions);
        
        return axesStream;
    }
    
    private static List<XElement> CreateLinearAxes(MachineData data, string timestamp)
    {
        var axes = new List<XElement>();
        
        if (data.XPosition != null)
        {
            axes.Add(CreateLinearAxis("X", "x", data.XPosition, data.XLoad, data.XFeedRate, timestamp));
        }
        
        if (data.YPosition != null)
        {
            axes.Add(CreateLinearAxis("Y", "y", data.YPosition, data.YLoad, data.YFeedRate, timestamp));
        }
        
        if (data.ZPosition != null)
        {
            axes.Add(CreateLinearAxis("Z", "z", data.ZPosition, data.ZLoad, data.ZFeedRate, timestamp));
        }
        
        return axes;
    }
    
    private static XElement CreateLinearAxis(string name, string id, AxisData position, 
        double? load, double? feedRate, string timestamp)
    {
        var axisStream = new XElement(ns + "ComponentStream",
            new XAttribute("component", "Linear"),
            new XAttribute("name", name),
            new XAttribute("componentId", id)
        );
        
        var samples = new XElement(ns + "Samples");
        
        if (position != null)
        {
            samples.Add(new XElement(ns + "Position",
                new XAttribute("dataItemId", $"{id}p"),
                new XAttribute("timestamp", timestamp),
                new XAttribute("name", $"{name}abs"),
                new XAttribute("sequence", (++_sequenceNumber).ToString()),
                new XAttribute("subType", "ACTUAL"),
                position.Actual.ToString("F6")
            ));
        }
        
        if (feedRate.HasValue)
        {
            samples.Add(new XElement(ns + "AxisFeedrate",
                new XAttribute("dataItemId", $"{id}f"),
                new XAttribute("timestamp", timestamp),
                new XAttribute("name", $"{name}frt"),
                new XAttribute("sequence", (++_sequenceNumber).ToString()),
                feedRate.Value.ToString()
            ));
        }
        
        if (load.HasValue)
        {
            samples.Add(new XElement(ns + "Load",
                new XAttribute("dataItemId", $"{id}l"),
                new XAttribute("timestamp", timestamp),
                new XAttribute("name", $"{name}load"),
                new XAttribute("sequence", (++_sequenceNumber).ToString()),
                load.Value.ToString()
            ));
        }
        
        if (samples.HasElements)
            axisStream.Add(samples);
        
        var conditions = new XElement(ns + "Condition");
        conditions.Add(new XElement(ns + "Normal",
            new XAttribute("dataItemId", $"{id}t"),
            new XAttribute("timestamp", timestamp),
            new XAttribute("name", $"{name}travel"),
            new XAttribute("sequence", (++_sequenceNumber).ToString()),
            new XAttribute("type", "POSITION")
        ));
        
        axisStream.Add(conditions);
        
        return axisStream;
    }
    
    private static XElement CreateSpindleStream(MachineData data, string timestamp)
    {
        var spindleStream = new XElement(ns + "ComponentStream",
            new XAttribute("component", "Rotary"),
            new XAttribute("name", "C"),
            new XAttribute("componentId", "c")
        );
        
        var samples = new XElement(ns + "Samples");
        
        if (data.SpindleSpeed.HasValue)
        {
            samples.Add(new XElement(ns + "SpindleSpeed",
                new XAttribute("dataItemId", "cs"),
                new XAttribute("timestamp", timestamp),
                new XAttribute("name", "Srpm"),
                new XAttribute("sequence", (++_sequenceNumber).ToString()),
                new XAttribute("subType", "ACTUAL"),
                data.SpindleSpeed.Value.ToString()
            ));
        }
        
        if (data.SpindleLoad.HasValue)
        {
            samples.Add(new XElement(ns + "Load",
                new XAttribute("dataItemId", "sl"),
                new XAttribute("timestamp", timestamp),
                new XAttribute("name", "Sload"),
                new XAttribute("sequence", (++_sequenceNumber).ToString()),
                data.SpindleLoad.Value.ToString()
            ));
        }
        
        if (data.SpindleOverride.HasValue)
        {
            samples.Add(new XElement(ns + "SpindleSpeed",
                new XAttribute("dataItemId", "cso"),
                new XAttribute("timestamp", timestamp),
                new XAttribute("name", "Sovr"),
                new XAttribute("sequence", (++_sequenceNumber).ToString()),
                new XAttribute("subType", "OVERRIDE"),
                data.SpindleOverride.Value.ToString()
            ));
        }
        
        if (samples.HasElements)
            spindleStream.Add(samples);
        
        var conditions = new XElement(ns + "Condition");
        conditions.Add(new XElement(ns + "Normal",
            new XAttribute("dataItemId", "spc"),
            new XAttribute("timestamp", timestamp),
            new XAttribute("name", "Sload_cond"),
            new XAttribute("sequence", (++_sequenceNumber).ToString()),
            new XAttribute("type", "LOAD")
        ));
        
        spindleStream.Add(conditions);
        
        return spindleStream;
    }
    
    private static XElement CreateDeviceStream(MachineData data, string timestamp)
    {
        var deviceStream = new XElement(ns + "ComponentStream",
            new XAttribute("component", "Device"),
            new XAttribute("name", data.MachineName),
            new XAttribute("componentId", "d1")
        );
        
        var events = new XElement(ns + "Events");
        
        events.Add(new XElement(ns + "Availability",
            new XAttribute("dataItemId", "avail"),
            new XAttribute("timestamp", timestamp),
            new XAttribute("sequence", (++_sequenceNumber).ToString()),
            data.ConnectionStatus == "CONNECTED" ? "AVAILABLE" : "UNAVAILABLE"
        ));
        
        deviceStream.Add(events);
        
        return deviceStream;
    }
    
    private static string MapExecutionStatus(string status)
    {
        return status?.ToUpper() switch
        {
            "STRT" => "ACTIVE",
            "STOP" => "STOPPED",
            "HOLD" => "INTERRUPTED",
            "MSTR" => "ACTIVE",
            _ => "STOPPED"
        };
    }
    
    private static string MapControllerMode(string mode)
    {
        return mode?.ToUpper() switch
        {
            "MEM" => "AUTOMATIC",
            "MDI" => "MANUAL_DATA_INPUT",
            "EDIT" => "EDIT",
            "HND" => "MANUAL",
            "JOG" => "MANUAL",
            "REF" => "MANUAL",
            _ => "MANUAL"
        };
    }
}

public class MachineData
{
    public string MachineName { get; set; }
    public string Uuid { get; set; }
    public string ConnectionStatus { get; set; }
    public string ExecutionStatus { get; set; }
    public string ControllerMode { get; set; }
    public string ProgramName { get; set; }
    public string EmergencyStop { get; set; }
    public int? SpindleSpeed { get; set; }
    public double? SpindleLoad { get; set; }
    public int? SpindleOverride { get; set; }
    public double? FeedRate { get; set; }
    public int? FeedOverride { get; set; }
    public int? PartCount { get; set; }
    public int? LineNumber { get; set; }
    public AxisData XPosition { get; set; }
    public AxisData YPosition { get; set; }
    public AxisData ZPosition { get; set; }
    public double? XLoad { get; set; }
    public double? YLoad { get; set; }
    public double? ZLoad { get; set; }
    public double? XFeedRate { get; set; }
    public double? YFeedRate { get; set; }
    public double? ZFeedRate { get; set; }
}

public class AxisData
{
    public double Actual { get; set; }
    public double? Commanded { get; set; }
}