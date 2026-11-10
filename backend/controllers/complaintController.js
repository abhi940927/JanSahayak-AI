import { ComplaintService } from '../services/complaintService.js';
import {
  createComplaintSchema,
  updateStatusSchema,
  assignOfficerSchema
} from '../validators/complaintValidator.js';

export const createComplaint = async (req, res, next) => {
  try {
    const validatedData = createComplaintSchema.parse(req.body);
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in or register on JanSahayak to raise a complaint.'
      });
    }
    const complaint = await ComplaintService.createComplaint(validatedData, req.user);
    res.status(201).json({
      success: true,
      message: 'Grievance submitted successfully and registered in system',
      data: complaint
    });
  } catch (err) {
    next(err);
  }
};

export const getComplaints = async (req, res, next) => {
  try {
    const { status, priority, department_id, search, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const result = await ComplaintService.getComplaints({
      user: req.user,
      status,
      priority,
      department_id,
      search,
      limit: parseInt(limit),
      offset
    });

    res.json({
      success: true,
      data: result.complaints,
      pagination: {
        total: result.total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(result.total / parseInt(limit))
      }
    });
  } catch (err) {
    next(err);
  }
};

export const getComplaintById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const complaint = await ComplaintService.getComplaintById(id, req.user);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Grievance not found with the provided identifier'
      });
    }

    res.json({
      success: true,
      data: complaint
    });
  } catch (err) {
    next(err);
  }
};

export const updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const validatedData = updateStatusSchema.parse(req.body);

    const updated = await ComplaintService.updateStatus(id, validatedData, req.user);
    res.json({
      success: true,
      message: `Status updated to ${validatedData.status}`,
      data: updated
    });
  } catch (err) {
    next(err);
  }
};

export const submitFeedback = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating, comments } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Valid rating between 1 and 5 is required' });
    }

    const feedback = await ComplaintService.submitFeedback(id, { rating, comments }, req.user);
    res.json({
      success: true,
      message: 'Citizen feedback recorded successfully',
      data: feedback
    });
  } catch (err) {
    next(err);
  }
};

export const reverseGeocodeLocation = async (req, res, next) => {
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon) {
      return res.status(400).json({ success: false, message: 'Latitude and Longitude query parameters are required' });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ success: false, message: 'Invalid coordinate numbers' });
    }

    // Call OpenStreetMap Nominatim reverse geocoding with custom User-Agent
    const osmUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;
    let locationData = null;

    try {
      const response = await fetch(osmUrl, {
        headers: { 'User-Agent': 'JanSahayakAI/1.0 (contact@jansahayak.gov.in)' },
        signal: AbortSignal.timeout(6000)
      });
      if (response.ok) {
        locationData = await response.json();
      }
    } catch (fetchErr) {
      console.warn('[Geocoding] OSM query warning:', fetchErr.message);
    }

    if (locationData && locationData.address) {
      const addr = locationData.address;
      const streetParts = [
        addr.road || addr.street || addr.pedestrian || locationData.name,
        addr.suburb || addr.neighbourhood || addr.residential || addr.subdistrict
      ].filter(Boolean);

      const street = streetParts.join(', ') || 'Current Geolocation Landmark';
      const city = addr.city || addr.town || addr.village || addr.county || addr.state_district || 'New Delhi';
      const state = addr.state || 'Delhi';
      const pincode = addr.postcode ? addr.postcode.replace(/\D/g, '').slice(0, 6) : '';

      return res.json({
        success: true,
        data: {
          address: street,
          city,
          state,
          pincode,
          latitude,
          longitude,
          formatted: locationData.display_name
        }
      });
    }

    // Fallback if OSM was unreachable
    return res.json({
      success: true,
      data: {
        address: `Near Geolocation Pin (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
        city: 'Delhi',
        state: 'Delhi',
        pincode: '',
        latitude,
        longitude
      }
    });
  } catch (err) {
    return res.json({
      success: true,
      data: {
        address: `Near GPS Pin (${req.query.lat || '28.6139'}, ${req.query.lon || '77.2090'})`,
        city: 'New Delhi',
        state: 'Delhi',
        pincode: '110001',
        latitude: parseFloat(req.query.lat) || 28.6139,
        longitude: parseFloat(req.query.lon) || 77.2090
      }
    });
  }
};

export const ipLocationLookup = async (req, res, next) => {
  try {
    const ipResponse = await fetch('https://ipapi.co/json/', {
      headers: { 'User-Agent': 'JanSahayakAI/1.0' },
      signal: AbortSignal.timeout(5000)
    });

    if (ipResponse.ok) {
      const data = await ipResponse.json();
      return res.json({
        success: true,
        data: {
          address: `Current Location (${data.city || 'Local Area'}, ${data.region || ''})`,
          city: data.city || 'New Delhi',
          state: data.region || 'Delhi',
          pincode: (data.postal || '').replace(/\D/g, '').slice(0, 6),
          latitude: data.latitude || 28.6139,
          longitude: data.longitude || 77.2090
        }
      });
    }

    return res.json({
      success: true,
      data: {
        address: 'Current Location',
        city: 'New Delhi',
        state: 'Delhi',
        pincode: '110001',
        latitude: 28.6139,
        longitude: 77.2090
      }
    });
  } catch (err) {
    return res.json({
      success: true,
      data: {
        address: 'Current Location',
        city: 'New Delhi',
        state: 'Delhi',
        pincode: '110001',
        latitude: 28.6139,
        longitude: 77.2090
      }
    });
  }
};
