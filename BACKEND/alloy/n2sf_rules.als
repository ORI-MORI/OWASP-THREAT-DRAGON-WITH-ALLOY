module n2sf_rules
open N2SF_Core

/* ==========================================================================
   [N2SF Rules Module]
   - Defines the concrete signatures used by the generator (System, Connection)
   - Implements advanced flow logic: Transitive Reachability & De-identification
   ========================================================================== */

// 1. Concrete Signatures (Mapped from JSON)

sig Location {
    id: one Int,
    type: one Int,
    grade: one Int
}

sig System extends Asset {
    id: one Int,
    location: one Location,
    // grade is mapped to 'level' in Asset via fact or implicit
    type: one Int,
    isCDS: one Bool,           // Cross Domain Solution (stops reachability)
    isDeidentifier: one Bool,  // De-identification Device (exempts violations)
    authCapability: one Int,
    isRegistered: one Bool,
    stores: set Data
}

sig Connection {
    from: one System,
    to: one System,
    carries: set Data,
    protocol: one Int,
    hasCDR: one Bool,
    hasAntiVirus: one Bool
}

// 2. Helper Functions & Predicates

// [Transitive Reachability with CDS Stop]
// Returns the set of Systems reachable from 'start' via Connections,
// but stopping traversal when a CDS (isCDS=True) is encountered.
fun reachable[start: System]: set System {
    start.^({ s1, s2: System | 
        some c: Connection | 
            c.from = s1 and c.to = s2 and 
            (s1.isCDS = False) // Stop if source is CDS (it breaks the flow for analysis)
            // Note: If s2 is CDS, it is included in the set, but we don't go *from* it.
    })
}

// [De-identification Check]
// Returns true if there is a path from 'start' to 'end' that passes through a De-identifier.
pred hasDeidentifierPath[start: System, end: System] {
    some mid: System | 
        mid in reachable[start] and 
        end in reachable[mid] and 
        mid.isDeidentifier = True
}

// 3. Violation Detection Logic

// [Flow Violation]
// Detects if sensitive data flows to a lower-level system.
// - Uses transitive reachability.
// - Exempts flow if a De-identifier is in the path.
fun FindFlowViolations: set Connection -> Data {
    { c: Connection, d: Data |
        // 1. The connection carries the data
        d in c.carries and
        
        // 2. Check reachability from the connection's source
        some target: reachable[c.from] | {
            // The target is the direct destination of this connection OR further downstream
            (target = c.to or target in reachable[c.to]) and
            
            // 3. Violation Condition: Data Level > Target System Level
            gt[d.classification, target.level] and
            
            // 4. Exception: No De-identifier in the path
            not hasDeidentifierPath[c.from, target]
        }
    }
}

// [Storage Violation]
// Data stored in a system with lower security level
fun FindStorageViolations: set System -> Data {
    { s: System, d: Data |
        d in s.stores and
        gt[d.classification, s.level]
    }
}

// [Location Violation]
// System in a location with lower security grade
fun FindLocationViolations: set System {
    { s: System |
        gt[s.level, s.location.grade] // Assuming Location has a 'grade' compatible with Level
    }
}

// [Bypass Violation]
// Connection between different zones without a CDS
fun FindBypassViolations: set Connection {
    { c: Connection |
        c.from.zone != c.to.zone and
        c.from.isCDS = False and
        c.to.isCDS = False
        // This is a simplified check. Real logic might need to check if *any* path exists without CDS.
    }
}

// [Unencrypted Channel Violation]
// External connection without encryption (simplified mapping)
fun FindUnencryptedChannels: set Connection {
    { c: Connection |
        (c.from.zone = External or c.to.zone = External) and
        // Assuming protocol 0 is unencrypted (e.g., HTTP/Telnet)
        c.protocol = 0 
    }
}

// [Auth/Integrity Gaps]
// System without proper auth or registration
fun FindAuthIntegrityGaps: set System {
    { s: System |
        s.isRegistered = False or
        s.authCapability = 0 // Assuming 0 is weak/none
    }
}

// [Content Control Failure]
// Malicious content entering internal zone without CDR/AV
fun FindContentControlFailures: set Connection -> Data {
    { c: Connection, d: Data |
        c.to.zone = Internal and
        d.content = Malicious and
        c.hasCDR = False and
        c.hasAntiVirus = False
    }
}

// [Unauthorized Device]
// Unregistered system
fun FindUnauthorizedDevices: set System {
    { s: System | s.isRegistered = False }
}
