const rp = require('request-promise');
const data = require('./data.json');

const DOMAIN_URL = 'https://moh-pac-demo.smilecdr.com:8000';

async function upload(jsonData) {
  for (const item of jsonData) {
    const RESOURCE_TYPE = item.resourceType;
    const ITEM_ID = item.id;

    if (item && item.contained && Array.isArray(item.contained) && item.contained.length > 0) {
      const contained = item.contained;

      for (const contained_item of contained) {
        if (contained_item.resourceType && contained_item.resourceType == 'Patient') {
          await processPatient(contained_item);
        } else if (contained_item.resourceType && contained_item.resourceType == 'Medication') {
          await processMedication(contained_item);
        } else if (contained_item.resourceType && contained_item.resourceType == 'Practitioner') { 
          await processPractitioner(contained_item);
        } else if (contained_item.resourceType && contained_item.resourceType == 'Organization') {
          await processOrganization(contained_item);
        } else if (contained_item.resourceType && contained_item.resourceType == 'MedicationRequest') {
          await processMedicationRequest(contained_item);
        }
      }

    }

    if (item.medicationReference && item.medicationReference.reference) {
      item.medicationReference.reference = replaceAll(item.medicationReference.reference, '#', 'Medication/');
    }

    if (item.subject && item.subject.reference) {
      item.subject.reference = replaceAll(item.subject.reference, '#', 'Patient/');
    }

    if (item.performer && Array.isArray(item.performer)) {
      for (const performer of item.performer) {
        processPerformer(performer);
      }
    }

    if (item.authorizingPrescription && Array.isArray(item.authorizingPrescription)) {
      for (const authPrescription of item.authorizingPrescription) {
        processAuthorizingPrescription(authPrescription);
      }
    }

    await insertResource(item, RESOURCE_TYPE, ITEM_ID);

    console.log('--------------------------------------------------------------------------------------');

    // break;
  }
}

async function processPatient(patient) {
  const resourceType = patient.resourceType;
  const id = patient.id;

  if (patient.id.indexOf('PatMaster') > -1) {
    await insertResource(patient, resourceType, id);
  } else if (patient.id.indexOf('PatDisp') > -1) {
    if (patient.link && Array.isArray(patient.link)) {
      for (const link of patient.link) {
        processLink(link);
      }
    }

    await insertResource(patient, resourceType, id);
  }

  return;
}

async function processMedication(medication) {
  const resourceType = medication.resourceType;
  const id = medication.id;

  await insertResource(medication, resourceType, id);
  
  return;
}

async function processPractitioner(practitioner) {
  const resourceType = practitioner.resourceType;
  const id = practitioner.id;

  if (practitioner.id.indexOf('PractPrescr') > -1) {
    await insertResource(practitioner, resourceType, id);
  } else if (practitioner.id.indexOf('PractDisp') > -1) {
    await insertResource(practitioner, resourceType, id);
  }

  return;
}

async function processOrganization(organization) {
  const resourceType = organization.resourceType;
  const id = organization.id;

  await insertResource(organization, resourceType, id);
  
  return;
}

async function processMedicationRequest(medicationRequest) {
  const resourceType = medicationRequest.resourceType;
  const id = medicationRequest.id;

  if (medicationRequest.medicationReference && medicationRequest.medicationReference.reference) {
    medicationRequest.medicationReference.reference = replaceAll(medicationRequest.medicationReference.reference, '#', 'Medication/');
  }

  if (medicationRequest.subject && medicationRequest.subject.reference) {
    medicationRequest.subject.reference = replaceAll(medicationRequest.subject.reference, '#', 'Patient/');
  }

  if (medicationRequest.requester && medicationRequest.requester.agent && medicationRequest.requester.agent.reference) {
    medicationRequest.requester.agent.reference = replaceAll(medicationRequest.requester.agent.reference, '#', 'Practitioner/');
  }

  await insertResource(medicationRequest, resourceType, id);
  
  return;
}

function processLink(link) {
  if (link.other && link.other.reference && link.other.reference.indexOf('#') > -1) {
    let reference = link.other.reference;

    if (reference.indexOf('PatMaster') > -1) {
      reference = replaceAll(reference, '#', 'Patient/');
    } else if (reference.indexOf('Medication') > -1) {
      reference = replaceAll(reference, '#', 'Medication/');
    } else if (reference.indexOf('PatDisp') > -1) {
      reference = replaceAll(reference, '#', 'Patient/');
    } else if (reference.indexOf('PractPrescr') > -1) {
      reference = replaceAll(reference, '#', 'Practitioner/');
    } else if (reference.indexOf('PractDisp') > -1) {
      reference = replaceAll(reference, '#', 'Practitioner/');
    } else if (reference.indexOf('OrgPharm') > -1) {
      reference = replaceAll(reference, '#', 'Organization/');
    } else if (reference.indexOf('MedRequest') > -1) {
      reference = replaceAll(reference, '#', 'MedicationRequest/');      
    }

    link.other.reference = reference;
  }
}

function processPerformer(performer) {
  if (performer && performer.actor && performer.actor.reference) {
    if (performer.actor.reference.indexOf('PatMaster') > -1) {
      performer.actor.reference = replaceAll(performer.actor.reference, '#', 'Patient/');
    } else if (performer.actor.reference.indexOf('Medication') > -1) {
      performer.actor.reference = replaceAll(performer.actor.reference, '#', 'Medication/');
    } else if (performer.actor.reference.indexOf('PatDisp') > -1) {
      performer.actor.reference = replaceAll(performer.actor.reference, '#', 'Patient/');
    } else if (performer.actor.reference.indexOf('PractPrescr') > -1) {
      performer.actor.reference = replaceAll(performer.actor.reference, '#', 'Practitioner/');
    } else if (performer.actor.reference.indexOf('PractDisp') > -1) {
      performer.actor.reference = replaceAll(performer.actor.reference, '#', 'Practitioner/');
    } else if (performer.actor.reference.indexOf('OrgPharm') > -1) {
      performer.actor.reference = replaceAll(performer.actor.reference, '#', 'Organization/');
    } else if (performer.actor.reference.indexOf('MedRequest') > -1) {
      performer.actor.reference = replaceAll(performer.actor.reference, '#', 'MedicationRequest/');
    }
  }
}

function processAuthorizingPrescription(authPrescription) {
  if (authPrescription && authPrescription.reference) {
    if (authPrescription.reference.indexOf('PatMaster') > -1) {
      authPrescription.reference = replaceAll(authPrescription.reference, '#', 'Patient/');
    } else if (authPrescription.reference.indexOf('Medication') > -1) {
      authPrescription.reference = replaceAll(authPrescription.reference, '#', 'Medication/');
    } else if (authPrescription.reference.indexOf('PatDisp') > -1) {
      authPrescription.reference = replaceAll(authPrescription.reference, '#', 'Patient/');
    } else if (authPrescription.reference.indexOf('PractPrescr') > -1) {
      authPrescription.reference = replaceAll(authPrescription.reference, '#', 'Practitioner/');
    } else if (authPrescription.reference.indexOf('PractDisp') > -1) {
      authPrescription.reference = replaceAll(authPrescription.reference, '#', 'Practitioner/');
    } else if (authPrescription.reference.indexOf('OrgPharm') > -1) {
      authPrescription.reference = replaceAll(authPrescription.reference, '#', 'Organization/');
    } else if (authPrescription.reference.indexOf('MedRequest') > -1) {
      authPrescription.reference = replaceAll(authPrescription.reference, '#', 'MedicationRequest/');
    }
  }
}

function replaceAll(str, search, replacement) {
  return str.replace(new RegExp(search, 'g'), replacement);  
}

async function insertResource(obj, resourceType, id) {
  try {
    const options = {
      method: 'PUT',
      uri: `${DOMAIN_URL}/${resourceType}/${id}`,
      body: obj,
      json: true // Automatically stringifies the body to JSON
    };
  
    let result = await rp(options);

    // if (result && result.issue && result.issue[0].diagnostics) {
    //   console.log('ResourceType: ', resourceType, ' Id: ', id, ' Successful');
    // } else {
    //   console.log('\n**** ', JSON.stringify(result));
    // }
    console.log(JSON.stringify(result))
  } catch (error) {
    console.error(JSON.stringify(error));
  }

  return;
}

upload(data);