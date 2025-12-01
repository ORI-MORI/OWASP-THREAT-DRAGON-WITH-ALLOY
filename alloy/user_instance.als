module user_instance
open n2sf_rules

one sig Location1, Location2 extends Location {}
fact { Location1.id = 1 and Location1.type = Intranet and Location1.grade = Sensitive }
fact { Location2.id = 2 and Location2.type = Internet and Location2.grade = Open }
fact { Location = Location1 + Location2 }

one sig Data1, Data2 extends Data {}
fact { Data1.id = 1 and Data1.grade = Sensitive and Data1.fileType = Document }
fact { Data2.id = 2 and Data2.grade = Open and Data2.fileType = Media }
fact { Data = Data1 + Data2 }

one sig System101, System102 extends System {}
fact { 
    System101.id = 101 
    System101.location = Location1 
    System101.grade = Sensitive 
    System101.type = Server 
    System101.isCDS = False 
    System101.authCapability = MFA 
    System101.isRegistered = True 
    System101.stores = Data1 
}
fact { 
    System102.id = 102 
    System102.location = Location2 
    System102.grade = Open 
    System102.type = Terminal 
    System102.isCDS = False 
    System102.authCapability = Single 
    System102.isRegistered = True 
    System102.stores = Data2 
}
fact { System = System101 + System102 }

one sig Connection1 extends Connection {}
fact { 
    Connection1.from = System101 
    Connection1.to = System102 
    Connection1.carries = Data1 
    Connection1.protocol = HTTPS 
    Connection1.hasCDR = False 
    Connection1.hasAntiVirus = True 
}
fact { Connection = Connection1 }

one sig AnalysisResult {
    FindStorageViolations: set System -> Data,
    FindFlowViolations: set Connection -> Data,
    FindLocationViolations: set System,
    FindBypassViolations: set Connection,
    FindUnencryptedChannels: set Connection,
    FindAuthIntegrityGaps: set System,
    FindContentControlFailures: set Connection -> Data,
    FindUnauthorizedDevices: set System
}

fact {
    AnalysisResult.FindStorageViolations = FindStorageViolations
    AnalysisResult.FindFlowViolations = FindFlowViolations
    AnalysisResult.FindLocationViolations = FindLocationViolations
    AnalysisResult.FindBypassViolations = FindBypassViolations
    AnalysisResult.FindUnencryptedChannels = FindUnencryptedChannels
    AnalysisResult.FindAuthIntegrityGaps = FindAuthIntegrityGaps
    AnalysisResult.FindContentControlFailures = FindContentControlFailures
    AnalysisResult.FindUnauthorizedDevices = FindUnauthorizedDevices
}

run CheckViolations { some AnalysisResult }
