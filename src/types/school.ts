export interface SchoolIdentity {
  schoolCode: string;
  schoolName: string;
  officeCode: string;
}

export interface SchoolResult extends SchoolIdentity {
  englishSchoolName: string;
  schoolKind: string;
  officeName: string;
  locationName: string;
  roadAddress: string;
}
