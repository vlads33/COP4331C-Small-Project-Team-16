<?php

	$inData = getRequestInfo();
	$ID = $inData["ContactID"];
	$phone = $inData["PhoneNumber"];
	$email = $inData["Email"];
	$firstname = $inData["FirstName"];
	$lastname = $inData["LastName"];
	$notes = $inData["Notes"];
	
	$searchResults = "";
	$searchCount = 0;

	$conn = new mysqli("localhost", "TheBeast", "WeLoveCOP4331", "COP4331");
	if ($conn->connect_error) 
	{
		returnWithError( $conn->connect_error );
	} 
	else
	{
		$stmt = $conn->prepare("UPDATE Contacts SET FirstName=?, LastName=?, Email=?, Phone=?, Notes=? where ID=?");
		$stmt->bind_param("ssssss", $firstname, $lastname, $email, $phone, $notes, $ID);
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
		$retValue = '{"id":0,"firstName":"","lastName":"","error":"' . $err . '"}';
		sendResultInfoAsJson( $retValue );
	}
?>