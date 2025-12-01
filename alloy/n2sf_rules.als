module n2sf_rules

open n2sf_base

// Helper predicate for ordering Grades
pred gt[g1, g2: Grade] {
    (g1 = Classified and (g2 = Sensitive or g2 = Open)) or
    (g1 = Sensitive and g2 = Open)
}

// 1. Storage Violation Engine
// Rule: Data grade must not exceed System grade.
fun FindStorageViolations: System -> Data {
    { s: System, d: Data | 
        d in s.stores and 
        gt[d.grade, s.grade] 
    }
}

// 2. Flow Violation Engine (Transmission)
// Rule: Data grade must not exceed Destination System grade.
// Exception: If Destination is a CDS (Cross Domain Solution), it is allowed.
fun FindFlowViolations: Connection -> Data {
    { c: Connection, d: Data |
        d in c.carries and
        gt[d.grade, c.to.grade] and
        c.to.isCDS = False
    }
}

// 3. Location Violation Engine
// Rule: System grade must not exceed Location grade.
fun FindLocationViolations: set System {
    { s: System | 
        gt[s.grade, s.location.grade] 
    }
}

// 4. Bypass Violation Engine
// Rule: Connections between different Zones must go through a CDS.
fun FindBypassViolations: set Connection {
    { c: Connection |
        c.from.location != c.to.location and
        c.from.isCDS = False and
        c.to.isCDS = False
    }
}

// 5. Unencrypted Channel Engine
// Rule: Sensitive or Classified data must not be sent via ClearText protocol.
fun FindUnencryptedChannels: set Connection {
    { c: Connection |
        c.protocol = ClearText and
        (some d: c.carries | d.grade = Sensitive or d.grade = Classified)
    }
}

// 6. Auth/Integrity Gap Engine
// Rule: Systems storing Sensitive/Classified data must have MFA.
fun FindAuthIntegrityGaps: set System {
    { s: System |
        s.authCapability = Single and
        (some d: s.stores | d.grade = Sensitive or d.grade = Classified)
    }
}

// 7. Content Control Failure Engine
// Rule: Document files must pass through CDR (Content Disarm & Reconstruction).
fun FindContentControlFailures: Connection -> Data {
    { c: Connection, d: Data |
        d in c.carries and
        d.fileType = Document and
        c.hasCDR = False
    }
}

// 8. Unauthorized Device Engine
// Rule: Terminals must be registered.
fun FindUnauthorizedDevices: set System {
    { s: System |
        s.type = Terminal and
        s.isRegistered = False
    }
}
