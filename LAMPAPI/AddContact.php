<?php
	$inData = getRequestInfo();
	
	$userId = $inData["userID"];
	$firstname = $inData["firstName"];
	$lastname = $inData["lastName"];
	$email = $inData["email"];
	$phone = $inData["phone"];
	$notes = $inData["notes"];

	$conn = new mysqli("localhost", "TheBeast", "WeLoveCOP4331", "COP4331");
	if ($conn->connect_error) 
	{
		returnWithError( $conn->connect_error );
	} 
	else
	{
		$stmt = $conn->prepare("INSERT into Contacts (UserID,FirstName,LastName,Email,Phone,Notes) VALUES(?,?,?,?,?,?)");
		$stmt->bind_param("ssssss", $userId, $firstname, $lastname, $email, $phone, $notes);
		$stmt->execute();
		$stmt->close();
		$conn->close();
		returnWithError(""); 
	}

	function getRequestInfo()
	{
		return json_decode(file_get_contents('php://input'), true);
	}

	function sendResultInfoAsJson( $obj )
	{
		header('Content-type: application/json');
		echo $obj;
	}
	
	function returnWithError( $err )
	{
		$retValue = '{"error":"' . $err . '"}';
		sendResultInfoAsJson( $retValue );
	}
	
?>