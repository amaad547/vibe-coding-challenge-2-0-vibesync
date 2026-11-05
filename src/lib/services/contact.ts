import { connectToDatabase } from "@/lib/db/mongodb";
import { User, IUser } from "@/models/User";

export interface AcademyContactData {
  coachName: string;
  email: string;
  phone: string;
  officePhone: string;
  academyAddress: string;
  morningHours: string;
  eveningHours: string;
  emergencyContact: string;
  bio: string;
  updatedAt?: string;
}

export const DEFAULT_CONTACT_DETAILS: AcademyContactData = {
  coachName: "Dumka Head Coach",
  email: "coach@dumkasports.org",
  phone: "+91 94311 00000",
  officePhone: "+91 (06434) 220000",
  academyAddress: "Dumka Sports Complex, Near Indoor Stadium, SP College Road, Dumka, Jharkhand - 814101",
  morningHours: "5:30 AM – 9:00 AM",
  eveningHours: "3:30 PM – 7:00 PM",
  emergencyContact: "On-field Medical & Staff",
  bio: "Head coach and operations supervisor at Dumka Sports Academy.",
};

/**
 * Retrieves the current academy contact details as configured by the coach.
 * Falls back to academy defaults if not yet customized.
 */
export async function getAcademyContact(): Promise<AcademyContactData> {
  try {
    await connectToDatabase();
    const coach = await User.findOne({ role: "COACH", isActive: true })
      .sort({ updatedAt: -1 })
      .lean<IUser | null>();

    if (!coach) {
      return DEFAULT_CONTACT_DETAILS;
    }

    return {
      coachName: coach.name || DEFAULT_CONTACT_DETAILS.coachName,
      email: coach.email || DEFAULT_CONTACT_DETAILS.email,
      phone: coach.phone || DEFAULT_CONTACT_DETAILS.phone,
      officePhone: coach.officePhone || DEFAULT_CONTACT_DETAILS.officePhone,
      academyAddress: coach.academyAddress || DEFAULT_CONTACT_DETAILS.academyAddress,
      morningHours: coach.morningHours || DEFAULT_CONTACT_DETAILS.morningHours,
      eveningHours: coach.eveningHours || DEFAULT_CONTACT_DETAILS.eveningHours,
      emergencyContact: coach.emergencyContact || DEFAULT_CONTACT_DETAILS.emergencyContact,
      bio: coach.bio || DEFAULT_CONTACT_DETAILS.bio,
      updatedAt: coach.updatedAt ? new Date(coach.updatedAt).toISOString() : undefined,
    };
  } catch (error) {
    console.error("Error retrieving academy contact details:", error);
    return DEFAULT_CONTACT_DETAILS;
  }
}
