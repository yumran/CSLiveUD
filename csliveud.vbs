Dim Wsh
Set args = WScript.Arguments
'For I = 0 to args.Count-1
'	WScript.Echo args(I)
'Next
Set Wsh=WScript.CreateObject("WScript.Shell")
Wsh.Run args(0) &" " &args(1) &" " &args(2)
Set Wsh=Nothing
WScript.quit
