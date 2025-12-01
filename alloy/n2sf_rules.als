module n2sf_rules

open n2sf_base

// 1. Storage Violation Engine
// Rule: Data grade must not exceed System grade.
// Returns: Set of (System, Data) tuples where violation occurs.
fun FindStorageViolations: System -> Data {
    { s: System, d: Data | 
        d in s.stores and 
        gt[d.grade, s.grade] 
    }
}

// 2. Flow Violation Engine (Transmission)
// Rule: Data grade must not exceed Destination System grade.
// Exception: If Destination is a Gateway or CDS, it is allowed (assumed to handle security).
// Returns: Set of (Connection, Data) tuples where violation occurs.
fun FindFlowViolations: Connection -> Data {
    { c: Connection, d: Data |
        d in c.carries and
        gt[d.grade, c.to.grade] and
        c.to.type != Gateway and
        c.to.type != CDS
    }
}

// 3. Location Violation Engine
// Rule: System grade must not exceed Location grade.
// Returns: Set of Systems where violation occurs.
fun FindLocationViolations: set System {
    { s: System | 
        gt[s.grade, s.location.grade] 
    }
}

// 4. Bypass Violation Engine
// Rule: Connections between different Zones (Locations) must go through a Gateway.
// Logic: If from.location != to.location, then either 'from' or 'to' must be a Gateway/CDS.
// (Simplified logic: Direct connection between non-gateways in different zones is a bypass)
// Returns: Set of Connections where violation occurs.
fun FindBypassViolations: set Connection {
    { c: Connection |
        c.from.location != c.to.location and
        c.from.type != Gateway and
        c.from.type != CDS and
        c.to.type != Gateway and
        c.to.type != CDS
    }
}

// 5. Unencrypted Channel Engine
// Rule: Sensitive or Classified data must be encrypted in transit.
// Returns: Set of Connections where violation occurs.
fun FindUnencryptedChannels: set Connection {
    { c: Connection |
        c.isEncrypted = False and
        (some d: c.carries | d.grade = Sensitive or d.grade = Classified)
    }
}

// 6. Auth/Integrity Gap Engine
// Rule: Systems storing Sensitive/Classified data must have authentication (ID_PW or MFA).
// Returns: Set of Systems where violation occurs.
fun FindAuthIntegrityGaps: set System {
    { s: System |
        s.authType = NoAuth and
        (some d: s.stores | d.grade = Sensitive or d.grade = Classified)
    }
}

// 7. Content Control Failure Engine
// Rule: Connections carrying data must have CDR (Content Disarm & Reconstruction) if required.
// Returns: Set of (Connection, Data) tuples where violation occurs.
fun FindContentControlFailures: Connection -> Data {
    { c: Connection, d: Data |
        d in c.carries and
        (d.grade = Sensitive or d.grade = Classified) and
        c.hasCDR = False
    }
}

// End of file

// Empty run command to trigger execution and XML generation
// End of file
