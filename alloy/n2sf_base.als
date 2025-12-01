module n2sf_base

// Enums
enum Grade { Classified, Sensitive, Open }
enum ZoneType { Internet, Intranet, DMZ, Wireless }
enum NodeType { Terminal, Server, SecurityDevice }
enum AuthCapability { Single, MFA }
enum FileType { Document, Executable, Media }
enum Protocol { HTTPS, SSH, VPN_Tunnel, ClearText, SQL }
enum Boolean { True, False }

// Signatures
sig Location {
    id: Int,
    grade: Grade,
    type: ZoneType
}

sig Data {
    id: Int,
    grade: Grade,
    fileType: FileType
}

sig System {
    id: Int,
    location: Location,
    grade: Grade,
    type: NodeType,
    isCDS: Boolean,
    authCapability: AuthCapability,
    isRegistered: Boolean,
    stores: set Data
}

sig Connection {
    from: System,
    to: System,
    protocol: Protocol,
    carries: set Data,
    hasCDR: Boolean,
    hasAntiVirus: Boolean
}
