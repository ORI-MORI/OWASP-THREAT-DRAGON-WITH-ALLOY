module user_instance
open n2sf_rules

one sig Location1 extends Location {}
fact { Location1.id = 1 and Location1.type = Internet and Location1.grade = Open }
fact { Location = Location1 }

one sig Data999 extends Data {}
fact { Data999.id = 999 and Data999.grade = Classified }
fact { Data = Data999 }

one sig System99 extends System {}
fact { 
    System99.id = 99 
    System99.location = Location1 
    System99.grade = Open 
    System99.type = PC 
    System99.authType = NoAuth 
    System99.stores = Data999 
}
fact { System = System99 }

fact { no Connection }

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
