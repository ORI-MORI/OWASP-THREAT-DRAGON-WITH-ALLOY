module user_instance
open n2sf_rules

fact { no Location }

fact { no Data }

one sig System100, System101 extends System {}
fact { 
    System100.id = 100 
    System100.location = Location1 
    System100.grade = Open 
    System100.type = Server 
    System100.authType = ID_PW 
    System100.stores = none 
}
fact { 
    System101.id = 101 
    System101.location = Location1 
    System101.grade = Sensitive 
    System101.type = PC 
    System101.authType = ID_PW 
    System101.stores = none 
}
fact { System = System100 + System101 }

one sig Connection0 extends Connection {}
fact { 
    Connection0.from = System100 
    Connection0.to = System101 
    Connection0.carries = none 
    Connection0.protocol = HTTP 
    Connection0.isEncrypted = False 
    Connection0.hasCDR = False 
}
fact { Connection = Connection0 }

one sig AnalysisResult {
    FindStorageViolations: set System -> Data,
    FindFlowViolations: set Connection -> Data,
    FindLocationViolations: set System,
    FindBypassViolations: set Connection,
    FindUnencryptedChannels: set Connection,
    FindAuthIntegrityGaps: set System,
    FindContentControlFailures: set Connection -> Data
}

fact {
    AnalysisResult.FindStorageViolations = FindStorageViolations
    AnalysisResult.FindFlowViolations = FindFlowViolations
    AnalysisResult.FindLocationViolations = FindLocationViolations
    AnalysisResult.FindBypassViolations = FindBypassViolations
    AnalysisResult.FindUnencryptedChannels = FindUnencryptedChannels
    AnalysisResult.FindAuthIntegrityGaps = FindAuthIntegrityGaps
    AnalysisResult.FindContentControlFailures = FindContentControlFailures
}

run CheckViolations { some AnalysisResult }
