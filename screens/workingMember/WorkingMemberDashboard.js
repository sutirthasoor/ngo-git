// screens/workingMember/WorkingMemberDashboard.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  Modal,
  Alert,
  Share,
  FlatList,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { db, getAuthInstance } from '../../config/firebase';

import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  orderBy,
  limit,
  onSnapshot,
  updateDoc,
} from 'firebase/firestore';
import { Fonts } from '../../config/fonts';
import {
  getLevelDetails,
  getLevelProgress,
  isEligibleForPromotion,
  getPromotionRequirements,
} from '../../config/commissionLevels';
import { WalletService } from '../../services/WalletService';
import { CommissionService } from '../../services/CommissionService';
import { LevelUpdateService } from '../../services/LevelUpdateService';
import { useLanguage } from '../../context/LanguageContext';

// ============ LEVEL HELPERS ============
const getLevelBadge = (levelId) => {
  const badges = {
    I: '⭐', II: '🌟', III: '💫', IV: '✨', V: '🌟', VI: '⭐', VII: '👑',
  };
  return badges[levelId] || '⭐';
};

const getLevelColor = (levelId) => {
  const colors = {
    I: '#8b5cf6', II: '#3b82f6', III: '#10b981',
    IV: '#f59e0b', V: '#ef4444', VI: '#8b5cf6', VII: '#fbbf24',
  };
  return colors[levelId] || '#8b5cf6';
};

const getLevelLabel = (levelId, dynamicLevels = []) => {
  if (dynamicLevels && dynamicLevels.length > 0) {
    const dynamicLevel = dynamicLevels.find((l) => l.id === levelId);
    if (dynamicLevel) return dynamicLevel.name || levelId;
  }
  const details = getLevelDetails(levelId);
  return details?.title || levelId;
};

export default function WorkingMemberDashboard({ navigation }) {
  const { t, counter } = useLanguage();
  const renderKey = `working-dashboard-${counter}`;

  const translations = {
    loading: t('common.loading') || 'Loading...',
    nA: t('common.nA') || 'N/A',
    close: t('common.close') || 'Close',
    error: t('common.error') || 'Error',
    success: t('common.success') || 'Success',
    hi: t('common.hi') || 'Hi',
    subGreeting: t('dashboard.workingSubGreeting') || 'Welcome to Working Member Dashboard',
    members: t('dashboard.members') || 'Members',
    shop: t('dashboard.shop') || 'Shop',
    events: t('dashboard.events') || 'Events',
    wallet: t('dashboard.wallet') || 'Wallet',
    referral: t('dashboard.referral') || 'Referral',
    membersLabel: t('dashboard.members') || 'Members',
    commission: t('dashboard.commission') || 'Commission',
    pending: t('common.pending') || 'Pending',
    orders: t('dashboard.orders') || 'Orders',
    donationsProgress: t('dashboard.donationsProgress') || 'Donations Progress',
    neededForNextLevel: t('dashboard.neededForNextLevel') || 'needed for {level}',
    moreInDonationsNeeded: t('dashboard.moreInDonationsNeeded') || '₹{amount} more in donations needed',
    readyForPromotion: t('dashboard.readyForPromotion') || '🎉 Ready for promotion!',
    toReach: t('dashboard.toReach') || 'to reach',
    eligibleForPromotion: t('dashboard.eligibleForPromotion') || 'Eligible for Promotion!',
    highestLevelReached: t('dashboard.highestLevelReached') || "🎉 You've reached the highest level!",
    directMembers: t('dashboard.directMembers') || 'Direct Members',
    totalMembers: t('dashboard.totalMembers') || 'Total Members',
    totalDonations: t('dashboard.totalDonations') || 'Total Donations',
    noDonationTarget: t('dashboard.noDonationTarget') || 'No donation target set for next level',
    walletTitle: t('dashboard.wallet') || 'Wallet',
    availableBalance: t('dashboard.availableBalance') || 'Available Balance',
    totalEarned: t('dashboard.totalEarned') || 'Total Earned',
    pendingLabel: t('common.pending') || 'Pending',
    donationCommissions: t('dashboard.donationCommissions') || '❤️ Donations',
    referralTitle: t('dashboard.referralTitle') || 'Referral Code',
    referralSubtext: t('dashboard.referralSubtext') || 'Share your referral code to earn commissions',
    noReferralCode: t('dashboard.noReferralCode') || 'No referral code generated yet',
    generateReferral: t('dashboard.generateReferral') || 'Generate Referral Code',
    yourReferralCode: t('dashboard.yourReferralCode') || 'Your Referral Code',
    shareCode: t('dashboard.shareCode') || 'Share Code',
    copyCode: t('dashboard.copyCode') || 'Copy Code',
    referralMessage: t('dashboard.referralMessage') || 'Join using my referral code: {code}',
    recentRegistrations: t('dashboard.recentRegistrations') || 'Recent Registrations',
    viewAll: t('common.viewAll') || 'View All',
    noRecentRegistrations: t('dashboard.noRecentRegistrations') || 'No recent registrations',
    quickActions: t('donation.quickActions') || 'Quick Actions',
    applications: t('dashboard.applications') || 'Applications',
    applyForServices: t('dashboard.applyForServices') || 'Apply for services & competitions',
    eventsLabel: t('dashboard.events') || 'Events',
    viewEvents: t('dashboard.viewEvents') || 'View upcoming events',
    walletLabel: t('dashboard.wallet') || 'Wallet',
    viewWalletBalance: t('dashboard.viewWalletBalance') || 'View your wallet balance',
    viewNotices: t('dashboard.viewNotices') || 'View Notices',
    checkUpdates: t('dashboard.checkUpdates') || 'Check latest updates',
    submitComplaint: t('dashboard.submitComplaint') || 'Submit Complaint',
    reportIssue: t('dashboard.reportIssue') || 'Report an issue',
    submitSuggestion: t('dashboard.submitSuggestion') || 'Submit Suggestion',
    shareIdeas: t('dashboard.shareIdeas') || 'Share your ideas',
    companyInfo: t('dashboard.companyInfo') || 'Company Info',
    viewCompanyDetails: t('dashboard.viewCompanyDetails') || 'View company details',
    closeButton: t('common.close') || 'Close',
    workingMember: 'Working Member',
    newMemberRegistered: '{name} registered',
    activity: 'Activity',
    downlineTitle: 'My Downline Network',
    downlineSubtitle: 'Working members linked below you',
    uplineTitle: 'My Upline Chain',
    uplineSubtitle: 'Working members above you',
    workingMembers: 'Working Members',
    registeredMembers: 'Registered Members',
    noDownline: 'No working members linked below you yet',
    noUpline: 'You are at the top of the hierarchy',
    expandHint: 'Tap to expand',
    collapseHint: 'Tap to collapse',
    viewAllMembers: 'View All Members',
    levelLabel: 'Level',
    directChild: 'Direct',
    indirectChild: 'Indirect',
    totalMembersInDownline: 'Total Members',
    you: 'You',
    root: 'Root',
    level: 'Level',
    member: 'Member',
    children: 'Children',
    // Detail modal strings
    memberDetail: 'Member Details',
    personalDetails: 'Personal Details',
    commissionDetails: 'Commission Earned',
    totalCommission: 'Total Commission',
    pendingCommission: 'Pending Commission',
    donationCommission: 'Donation Commission',
    totalDonationAmount: 'Total Donations Made',
    registeredMembersList: 'Registered Members',
    searchRegistered: 'Search registered members...',
    phone: 'Phone',
    email: 'Email',
    address: 'Address',
    joinedOn: 'Joined On',
    parentMember: 'Parent Member',
    status: 'Status',
    noRegisteredMembers: 'No members registered yet',
    tapForDetails: 'Tap for details',
    loadingDetails: 'Loading details...',
  };

  // ===== Core state =====
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [fabModalVisible, setFabModalVisible] = useState(false);
  const [pendingApplications, setPendingApplications] = useState(0);
  const [levelDetails, setLevelDetails] = useState(null);
  const [levelProgress, setLevelProgress] = useState(null);
  const [walletData, setWalletData] = useState(null);
  const [promotionData, setPromotionData] = useState(null);
  const [totalDonations, setTotalDonations] = useState(0);
  const [referralCode, setReferralCode] = useState('');
  const [referralModalVisible, setReferralModalVisible] = useState(false);
  const [generatingReferral, setGeneratingReferral] = useState(false);
  const [stats, setStats] = useState({
    totalMembers: 0,
    totalCommission: 0,
    pendingCommission: 0,
    totalOrders: 0,
    donationCommission: 0,
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [referredMembers, setReferredMembers] = useState([]);
  const [loadingReferred, setLoadingReferred] = useState(false);

  // Downline
  const [downlineData, setDownlineData] = useState([]);
  const [loadingDownline, setLoadingDownline] = useState(false);
  const [dynamicLevels, setDynamicLevels] = useState([]);
  const [downlineStats, setDownlineStats] = useState({
    total: 0, direct: 0, indirect: 0, workingMembers: 0, registeredMembers: 0, maxDepth: 0,
  });

  // Upline (NEW)
  const [uplineChain, setUplineChain] = useState([]);
  const [loadingUpline, setLoadingUpline] = useState(false);

  // Existing "registered members" modal
  const [selectedNodeMembers, setSelectedNodeMembers] = useState([]);
  const [selectedNodeName, setSelectedNodeName] = useState('');
  const [nodeMembersModalVisible, setNodeMembersModalVisible] = useState(false);
  const [loadingNodeMembers, setLoadingNodeMembers] = useState(false);

  // NEW: Working member detail modal
  const [wmDetailModalVisible, setWmDetailModalVisible] = useState(false);
  const [wmDetail, setWmDetail] = useState(null);
  const [wmDetailLoading, setWmDetailLoading] = useState(false);
  const [wmRegisteredMembers, setWmRegisteredMembers] = useState([]);
  const [wmCommission, setWmCommission] = useState({ total: 0, pending: 0, donation: 0 });
  const [wmDonations, setWmDonations] = useState(0);
  const [wmMembersSearch, setWmMembersSearch] = useState('');

  // ===== Mount =====
  useEffect(() => {
    fetchDynamicLevels();
  }, []);

  useEffect(() => {
    fetchUserData();
    const unsub = setupRealtimeListener();
    fetchStats();
    fetchRecentActivities();
    fetchPendingApplications();
    fetchPromotionProgress();
    fetchReferredMembers();
    fetchDownlineData();
    fetchUplineChain();
    return () => { if (unsub) unsub(); };
  }, []);

  // ===== Dynamic levels =====
  const fetchDynamicLevels = async () => {
    try {
      const settingsRef = doc(db, 'settings', 'commission');
      const settingsSnap = await getDoc(settingsRef);
      if (settingsSnap.exists()) {
        const settingsData = settingsSnap.data();
        if (settingsData.levels) setDynamicLevels(settingsData.levels);
      }
    } catch (error) {
      console.error('Error fetching dynamic levels:', error);
    }
  };

  // ===== Compact "registered members of a node" modal =====
  const fetchNodeDirectMembers = async (nodeId, nodeName) => {
    setLoadingNodeMembers(true);
    setSelectedNodeName(nodeName);
    try {
      const membersQuery = query(
        collection(db, 'users'),
        where('registeredBy', '==', nodeId),
        where('role', 'in', ['member', 'general', 'user'])
      );
      const membersSnap = await getDocs(membersQuery);
      const membersList = [];
      membersSnap.forEach((memberDoc) => {
        membersList.push({ id: memberDoc.id, ...memberDoc.data() });
      });
      setSelectedNodeMembers(membersList);
      setNodeMembersModalVisible(true);
    } catch (error) {
      console.error('Error fetching node members:', error);
      Alert.alert('Error', 'Failed to load members');
    } finally {
      setLoadingNodeMembers(false);
    }
  };

  // ===== NEW: open rich detail modal for a working member =====
  const openWorkingMemberDetail = async (member) => {
    setWmDetailModalVisible(true);
    setWmDetailLoading(true);
    setWmDetail(member);
    setWmRegisteredMembers([]);
    setWmCommission({ total: 0, pending: 0, donation: 0 });
    setWmDonations(0);
    setWmMembersSearch('');

    try {
      // 1) registered members
      try {
        const regSnap = await getDocs(
          query(collection(db, 'registeredMembers'), where('workingMemberId', '==', member.id))
        );
        const regList = [];
        regSnap.forEach((r) => regList.push({ id: r.id, ...r.data() }));
        setWmRegisteredMembers(regList);
      } catch (e) {
        console.warn('registeredMembers fetch skipped:', e);
      }

      // 2) commission
      let total = 0, pending = 0, donation = 0;
      try {
        const commSnap = await getDocs(
          query(collection(db, 'walletTransactions'), where('userId', '==', member.id))
        );
        commSnap.forEach((c) => {
          const d = c.data();
          const ty = d.type || '';
          const isCommission =
            ty.includes('commission') ||
            ty === 'direct_commission' ||
            ty === 'secondary_commission' ||
            ty === 'primary_commission';
          if (!isCommission) return;
          if (d.status === 'paid' || d.status === 'completed') {
            total += d.amount || 0;
            if ((d.description || '').toLowerCase().includes('donation')) {
              donation += d.amount || 0;
            }
          } else if (d.status === 'pending') {
            pending += d.amount || 0;
          }
        });
      } catch (e) {
        console.warn('Commission fetch skipped:', e);
      }
      setWmCommission({ total, pending, donation });

      // 3) donations made
      try {
        const donSnap = await getDocs(
          query(collection(db, 'donations'), where('memberId', '==', member.id))
        );
        let totalDon = 0;
        donSnap.forEach((d) => { totalDon += d.data().amount || 0; });
        setWmDonations(totalDon);
      } catch (e) {
        console.warn('Donations fetch skipped:', e);
      }
    } catch (e) {
      console.error('Error opening working member detail:', e);
    } finally {
      setWmDetailLoading(false);
    }
  };

  // ===== DOWNLINE tree =====
  const fetchDownlineData = async () => {
    const auth = getAuthInstance();
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    setLoadingDownline(true);
    try {
      const usersSnap = await getDocs(
        query(collection(db, 'users'), where('role', 'in', ['working', 'workingMember']))
      );
      const userMap = {};
      usersSnap.forEach((u) => { userMap[u.id] = { id: u.id, ...u.data() }; });

      const currentUser = userMap[userId] || userData;
      if (!currentUser) { setDownlineData([]); setLoadingDownline(false); return; }

      const levelsToUse = dynamicLevels.length > 0 ? dynamicLevels : getDefaultLevels();

      const buildTree = (parentId, depth = 0) => {
        const children = [];
        for (const [id, data] of Object.entries(userMap)) {
          if (data.parentId === parentId) {
            const directMemberCount = Object.values(userMap).filter(
              (u) =>
                u.registeredBy === id &&
                (u.role === 'member' || u.role === 'general' || u.role === 'user')
            ).length;

            const childNode = {
              id,
              ...data,
              depth: depth + 1,
              isWorkingMember: data.role === 'working' || data.role === 'workingMember',
              levelName: getLevelLabel(data.level, levelsToUse),
              levelColor: getLevelColor(data.level),
              levelBadge: getLevelBadge(data.level),
              directMemberCount,
              children: buildTree(id, depth + 1),
              childrenCount: Object.values(userMap).filter((u) => u.parentId === id).length,
            };
            children.push(childNode);
          }
        }
        children.sort((a, b) => {
          const aI = levelsToUse.findIndex((l) => l.id === a.level);
          const bI = levelsToUse.findIndex((l) => l.id === b.level);
          return (aI === -1 ? 999 : aI) - (bI === -1 ? 999 : bI);
        });
        return children;
      };

      const tree = buildTree(userId, 0);

      const rootDirectMemberCount = Object.values(userMap).filter(
        (u) =>
          u.registeredBy === userId &&
          (u.role === 'member' || u.role === 'general' || u.role === 'user')
      ).length;

      const allNodes = [];
      const flatten = (nodes) => { for (const n of nodes) { allNodes.push(n); if (n.children?.length) flatten(n.children); } };
      flatten(tree);

      const directCount = tree.length;
      const indirectCount = allNodes.length - directCount;
      const workingMembersCount = allNodes.filter((n) => n.isWorkingMember).length;
      const maxDepth = allNodes.reduce((m, n) => Math.max(m, n.depth || 0), 0);

      setDownlineStats({
        total: allNodes.length,
        direct: directCount,
        indirect: indirectCount,
        workingMembers: workingMembersCount,
        registeredMembers: allNodes.length - workingMembersCount,
        maxDepth,
      });

      setUserData((prev) => ({ ...prev, directMemberCount: rootDirectMemberCount }));
      setDownlineData(tree);
    } catch (error) {
      console.error('Error fetching downline data:', error);
    } finally {
      setLoadingDownline(false);
    }
  };

  // ===== NEW: UPLINE chain =====
  const fetchUplineChain = async () => {
    const auth = getAuthInstance();
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    setLoadingUpline(true);
    try {
      const chain = [];
      let currentId = userId;
      let safety = 0;
      const levelsToUse = dynamicLevels.length > 0 ? dynamicLevels : getDefaultLevels();

      while (currentId && safety < 50) {
        safety++;
        const snap = await getDoc(doc(db, 'users', currentId));
        if (!snap.exists()) break;
        const data = snap.data();

        if (currentId !== userId) {
          chain.push({
            id: currentId,
            ...data,
            levelColor: getLevelColor(data.level),
            levelName: getLevelLabel(data.level, levelsToUse),
            levelBadge: getLevelBadge(data.level),
            isWorkingMember: true,
          });
        }
        currentId = data.parentId || null;
      }
      setUplineChain(chain);
    } catch (e) {
      console.error('Error fetching upline:', e);
    } finally {
      setLoadingUpline(false);
    }
  };

  const getDefaultLevels = () => [
    { id: 'I', name: 'Customer', directCommission: 25, secondaryCommission: 10, donationsRequiredForPromotion: 10000 },
    { id: 'II', name: 'Executive', directCommission: 35, secondaryCommission: 5, donationsRequiredForPromotion: 25000 },
    { id: 'III', name: 'Manager', directCommission: 40, secondaryCommission: 2.5, donationsRequiredForPromotion: 50000 },
    { id: 'IV', name: 'Coordinator', directCommission: 42.5, secondaryCommission: 1.25, donationsRequiredForPromotion: 100000 },
    { id: 'V', name: 'Guide', directCommission: 43.75, secondaryCommission: 1.25, donationsRequiredForPromotion: 250000 },
    { id: 'VI', name: 'Leader', directCommission: 44.5, secondaryCommission: 0.75, donationsRequiredForPromotion: 500000 },
    { id: 'VII', name: 'Crown', directCommission: 45, secondaryCommission: 0.5, donationsRequiredForPromotion: Infinity },
  ];

  // ===== Visual tree =====
  const VisualTree = () => {
    if (loadingDownline) {
      return (
        <View style={styles.treeLoadingContainer}>
          <ActivityIndicator size="large" color="#8b5cf6" />
          <Text style={styles.treeLoadingText}>Loading downline...</Text>
        </View>
      );
    }
    if (downlineData.length === 0) {
      return (
        <View style={styles.treeEmptyContainer}>
          <MaterialIcons name="account-tree" size={50} color="#d1d5db" />
          <Text style={styles.treeEmptyTitle}>No Downline Members</Text>
          <Text style={styles.treeEmptySubtext}>Members assigned under you will appear here as a tree</Text>
        </View>
      );
    }

    const renderTreeNode = (node, isRoot = false) => {
      const hasChildren = node.children && node.children.length > 0;
      const isDirect = node.depth === 1;
      const levelColor = node.levelColor || getLevelColor(node.level);

      return (
        <View key={node.id} style={styles.treeNodeContainer}>
          <TouchableOpacity
            style={[
              styles.treeNodeCard,
              isRoot && styles.treeNodeRoot,
              isDirect && !isRoot && styles.treeNodeDirect,
              node.isWorkingMember && !isRoot && styles.treeNodeWorking,
            ]}
            onPress={() => {
              if (isRoot) {
                fetchNodeDirectMembers(node.id, 'You');
              } else {
                openWorkingMemberDetail(node);
              }
            }}
            activeOpacity={0.7}
          >
            <View style={styles.treeNodeLeft}>
              <View style={[styles.treeNodeLevelBadge, { backgroundColor: levelColor + '20' }]}>
                <Text style={[styles.treeNodeLevelText, { color: levelColor }]}>
                  {node.levelName || node.level || 'I'}
                </Text>
              </View>
              <View
                style={[
                  styles.treeNodeAvatar,
                  { backgroundColor: isRoot ? '#8b5cf6' : node.isWorkingMember ? '#8b5cf615' : '#10b98115' },
                ]}
              >
                {node.profilePhoto ? (
                  <Image source={{ uri: node.profilePhoto }} style={{ width: 36, height: 36, borderRadius: 18 }} />
                ) : (
                  <Text
                    style={[
                      styles.treeNodeAvatarText,
                      { color: isRoot ? '#ffffff' : node.isWorkingMember ? '#8b5cf6' : '#10b981' },
                    ]}
                  >
                    {node.fullName?.charAt(0)?.toUpperCase() || '?'}
                  </Text>
                )}
              </View>
              <View style={styles.treeNodeInfo}>
                <View style={styles.treeNodeNameRow}>
                  <Text style={[styles.treeNodeName, isRoot && styles.treeNodeNameRoot]} numberOfLines={1}>
                    {isRoot ? translations.you : node.fullName || node.name || 'Unknown'}
                  </Text>
                  {isRoot && (
                    <View style={styles.treeNodeRootBadge}>
                      <Text style={styles.treeNodeRootBadgeText}>Root</Text>
                    </View>
                  )}
                  {isDirect && !isRoot && (
                    <View style={styles.treeNodeDirectBadge}>
                      <Text style={styles.treeNodeDirectBadgeText}>Direct</Text>
                    </View>
                  )}
                </View>
                <View style={styles.treeNodeMeta}>
                  {node.isWorkingMember && (
                    <View style={styles.treeNodeWorkingBadge}>
                      <MaterialIcons name="star" size={10} color="#8b5cf6" />
                      <Text style={styles.treeNodeWorkingText}>Working</Text>
                    </View>
                  )}
                  <Text style={styles.treeNodeLevel}>
                    {translations.level} {node.level || 'I'}
                  </Text>
                  {hasChildren && (
                    <View style={styles.treeNodeChildCount}>
                      <MaterialIcons name="people" size={12} color="#8b5cf6" />
                      <Text style={styles.treeNodeChildCountText}>{node.children.length}</Text>
                    </View>
                  )}
                  {node.directMemberCount > 0 && (
                    <View style={styles.treeNodeDirectMemberBadge}>
                      <MaterialIcons name="person-add" size={10} color="#f59e0b" />
                      <Text style={styles.treeNodeDirectMemberBadgeText}>{node.directMemberCount}</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            <View style={styles.treeNodeRight}>
              <View
                style={[
                  styles.treeNodeStatus,
                  { backgroundColor: node.status === 'active' ? '#d1fae5' : '#fee2e2' },
                ]}
              >
                <View
                  style={[
                    styles.treeNodeStatusDot,
                    { backgroundColor: node.status === 'active' ? '#10b981' : '#ef4444' },
                  ]}
                />
                <Text
                  style={[
                    styles.treeNodeStatusText,
                    { color: node.status === 'active' ? '#10b981' : '#ef4444' },
                  ]}
                >
                  {node.status || 'inactive'}
                </Text>
              </View>
              {!isRoot && (
                <Text style={styles.treeNodeTapHint}>{translations.tapForDetails}</Text>
              )}
            </View>
          </TouchableOpacity>

          {hasChildren && (
            <View style={styles.treeNodeChildrenContainer}>
              <View style={styles.treeConnectorLine} />
              <View style={styles.treeConnectorHorizontal} />
              {node.children.map((child) => (
                <View key={child.id} style={styles.treeNodeChildWrapper}>
                  <View style={styles.treeConnectorVertical} />
                  {renderTreeNode(child, false)}
                </View>
              ))}
            </View>
          )}
        </View>
      );
    };

    const rootNode = {
      id: userData?.id || 'root',
      fullName: userData?.fullName || 'You',
      profilePhoto: userData?.profilePhoto,
      level: userData?.level || 'I',
      levelName: levelDetails?.title || getLevelLabel(userData?.level, dynamicLevels),
      levelColor: levelDetails?.color || getLevelColor(userData?.level),
      isWorkingMember: true,
      status: userData?.status || 'active',
      children: downlineData,
      childrenCount: downlineData.length,
      depth: 0,
    };

    return (
      <View style={styles.visualTreeContainer}>
        <View style={styles.treeStatsBar}>
          <View style={styles.treeStatItem}>
            <Text style={styles.treeStatNumber}>{downlineStats.total}</Text>
            <Text style={styles.treeStatLabel}>Total</Text>
          </View>
          <View style={styles.treeStatDivider} />
          <View style={styles.treeStatItem}>
            <Text style={[styles.treeStatNumber, { color: '#10b981' }]}>{downlineStats.direct}</Text>
            <Text style={styles.treeStatLabel}>Direct</Text>
          </View>
          <View style={styles.treeStatDivider} />
          <View style={styles.treeStatItem}>
            <Text style={[styles.treeStatNumber, { color: '#94a3b8' }]}>{downlineStats.indirect}</Text>
            <Text style={styles.treeStatLabel}>Indirect</Text>
          </View>
          <View style={styles.treeStatDivider} />
          <View style={styles.treeStatItem}>
            <Text style={[styles.treeStatNumber, { color: '#f59e0b' }]}>{downlineStats.maxDepth}</Text>
            <Text style={styles.treeStatLabel}>Depth</Text>
          </View>
        </View>
        <View style={styles.treeRootContainer}>{renderTreeNode(rootNode, true)}</View>
      </View>
    );
  };

  // ===== Realtime user =====
  const setupRealtimeListener = () => {
    const auth = getAuthInstance();
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const userRef = doc(db, 'users', userId);
    const unsubscribe = onSnapshot(userRef, async (userSnap) => {
      if (!userSnap.exists()) return;
      const data = userSnap.data();
      setUserData(data);
      setProfilePhoto(data.profilePhoto || null);
      setReferralCode(data.referralCode || '');

      const level = data.level || 'I';
      try {
        const settingsSnap = await getDoc(doc(db, 'settings', 'commission'));
        let dynLevels = null;
        if (settingsSnap.exists()) {
          const sd = settingsSnap.data();
          if (sd.levels) dynLevels = sd.levels;
        }

        let details;
        let nextLevelData = null;
        let nextLevelId = null;
        let nextLevelMinDonations = 0;

        if (dynLevels) {
          const levelData = dynLevels.find((l) => l.id === level);
          if (levelData) {
            details = { ...levelData, title: levelData.name, badge: getLevelBadge(level), color: getLevelColor(level) };
            const idx = dynLevels.findIndex((l) => l.id === level);
            if (idx !== -1 && idx < dynLevels.length - 1) {
              nextLevelData = dynLevels[idx + 1];
              nextLevelId = nextLevelData.id;
              nextLevelMinDonations = levelData.donationsRequiredForPromotion || 0;
            }
          } else {
            details = getLevelDetails(level);
            const nl = getLevelDetails(level).nextLevel;
            if (nl) { nextLevelId = nl; nextLevelMinDonations = getLevelDetails(nl).minDonations || 0; }
          }
        } else {
          details = getLevelDetails(level);
          const nl = getLevelDetails(level).nextLevel;
          if (nl) { nextLevelId = nl; nextLevelMinDonations = getLevelDetails(nl).minDonations || 0; }
        }

        if (nextLevelData) details.nextLevelData = nextLevelData;
        setLevelDetails(details);

        const donations = await CommissionService.getTotalDonationsByMember(userId);
        setTotalDonations(donations);

        const progress = {
          progress: nextLevelMinDonations > 0 ? Math.min((donations / nextLevelMinDonations) * 100, 100) : 100,
          nextLevel: nextLevelId,
          nextLevelTitle: nextLevelData ? nextLevelData.name : nextLevelId ? getLevelDetails(nextLevelId)?.title || nextLevelId : null,
          remainingDonations: nextLevelMinDonations > 0 ? Math.max(0, nextLevelMinDonations - donations) : 0,
          donationProgress: nextLevelMinDonations > 0 ? (donations / nextLevelMinDonations) * 100 : 100,
          requiredDonations: nextLevelMinDonations,
        };
        setLevelProgress(progress);

        const isEligible = nextLevelMinDonations > 0 && donations >= nextLevelMinDonations;
        setPromotionData({ isEligible });

        try {
          const wallet = await WalletService.getOrCreateWallet(userId);
          setWalletData(wallet);
        } catch (e) {
          console.error('Error fetching wallet:', e);
        }
      } catch (error) {
        console.error('Error fetching dynamic levels:', error);
        const details = getLevelDetails(level);
        setLevelDetails(details);
        const donations = await CommissionService.getTotalDonationsByMember(userId);
        setTotalDonations(donations);

        let progress = { progress: 0, nextLevel: null, nextLevelTitle: null, remainingDonations: 0, donationProgress: 0, requiredDonations: 0 };
        let isEligible = false;
        try {
          if (typeof getLevelProgress === 'function') progress = getLevelProgress(level, donations);
          if (typeof isEligibleForPromotion === 'function') isEligible = isEligibleForPromotion(level, donations);
        } catch (e) { console.warn('Level helpers missing:', e); }
        setLevelProgress(progress);
        setPromotionData({ isEligible });
      }
    });

    return unsubscribe;
  };

  const fetchReferredMembers = async () => {
    const auth = getAuthInstance();
    const userId = auth.currentUser?.uid;
    if (!userId) return;
    setLoadingReferred(true);
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const directReferrals = userDoc.data().directReferrals || [];
        if (directReferrals.length === 0) { setReferredMembers([]); return; }
        const members = [];
        for (const refId of directReferrals) {
          const refDoc = await getDoc(doc(db, 'users', refId));
          if (refDoc.exists()) members.push({ id: refId, ...refDoc.data() });
        }
        setReferredMembers(members);
      }
    } catch (e) {
      console.error('Error fetching referred members:', e);
    } finally {
      setLoadingReferred(false);
    }
  };

  const fetchUserData = async () => {
    try {
      const auth = getAuthInstance();
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const docSnap = await getDoc(doc(db, 'users', userId));
      if (!docSnap.exists()) return;
      const data = docSnap.data();
      setUserData(data);
      setProfilePhoto(data.profilePhoto || null);
      setReferralCode(data.referralCode || '');

      const level = data.level || 'I';
      try {
        const settingsSnap = await getDoc(doc(db, 'settings', 'commission'));
        let dynLevels = null;
        if (settingsSnap.exists()) {
          const sd = settingsSnap.data();
          if (sd.levels) dynLevels = sd.levels;
        }

        let details;
        let nextLevelData = null;
        let nextLevelId = null;
        let nextLevelMinDonations = 0;

        if (dynLevels) {
          const levelData = dynLevels.find((l) => l.id === level);
          if (levelData) {
            details = { ...levelData, title: levelData.name, badge: getLevelBadge(level), color: getLevelColor(level) };
            const idx = dynLevels.findIndex((l) => l.id === level);
            if (idx !== -1 && idx < dynLevels.length - 1) {
              nextLevelData = dynLevels[idx + 1];
              nextLevelId = nextLevelData.id;
              nextLevelMinDonations = levelData.donationsRequiredForPromotion || 0;
            }
          } else {
            details = getLevelDetails(level);
            const nl = getLevelDetails(level).nextLevel;
            if (nl) { nextLevelId = nl; nextLevelMinDonations = getLevelDetails(nl).minDonations || 0; }
          }
        } else {
          details = getLevelDetails(level);
          const nl = getLevelDetails(level).nextLevel;
          if (nl) { nextLevelId = nl; nextLevelMinDonations = getLevelDetails(nl).minDonations || 0; }
        }

        if (nextLevelData) details.nextLevelData = nextLevelData;
        setLevelDetails(details);

        const donations = await CommissionService.getTotalDonationsByMember(userId);
        setTotalDonations(donations);

        const progress = {
          progress: nextLevelMinDonations > 0 ? Math.min((donations / nextLevelMinDonations) * 100, 100) : 100,
          nextLevel: nextLevelId,
          nextLevelTitle: nextLevelData ? nextLevelData.name : nextLevelId ? getLevelDetails(nextLevelId)?.title || nextLevelId : null,
          remainingDonations: nextLevelMinDonations > 0 ? Math.max(0, nextLevelMinDonations - donations) : 0,
          donationProgress: nextLevelMinDonations > 0 ? (donations / nextLevelMinDonations) * 100 : 100,
          requiredDonations: nextLevelMinDonations,
        };
        setLevelProgress(progress);

        const isEligible = nextLevelMinDonations > 0 && donations >= nextLevelMinDonations;
        setPromotionData({ isEligible });

        try {
          const wallet = await WalletService.getOrCreateWallet(userId);
          setWalletData(wallet);
        } catch (e) {
          console.error('Error fetching wallet:', e);
        }
      } catch (error) {
        console.error('Error fetching dynamic levels:', error);
        const details = getLevelDetails(level);
        setLevelDetails(details);
        const donations = await CommissionService.getTotalDonationsByMember(userId);
        setTotalDonations(donations);

        let progress = { progress: 0, nextLevel: null, nextLevelTitle: null, remainingDonations: 0, donationProgress: 0, requiredDonations: 0 };
        let isEligible = false;
        try {
          if (typeof getLevelProgress === 'function') progress = getLevelProgress(level, donations);
          if (typeof isEligibleForPromotion === 'function') isEligible = isEligibleForPromotion(level, donations);
        } catch (e) { console.warn('Level helpers missing:', e); }
        setLevelProgress(progress);
        setPromotionData({ isEligible });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPromotionProgress = async () => {
    try {
      const auth = getAuthInstance();
      const userId = auth.currentUser?.uid;
      if (!userId) return;
      const progress = await LevelUpdateService.getPromotionProgress(userId);
      if (progress) setPromotionData(progress);
    } catch (error) {
      console.error('Error fetching promotion progress:', error);
    }
  };

  const fetchPendingApplications = async () => {
    try {
      const auth = getAuthInstance();
      const userId = auth.currentUser?.uid;
      if (!userId) return;
      const appsSnap = await getDocs(
        query(
          collection(db, 'serviceApplications'),
          where('userId', '==', userId),
          where('status', '==', 'pending')
        )
      );
      setPendingApplications(appsSnap.size);
    } catch (error) {
      console.error('Error fetching pending applications:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const auth = getAuthInstance();
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const membersSnap = await getDocs(
        query(collection(db, 'registeredMembers'), where('workingMemberId', '==', userId))
      );
      const commissionsSnap = await getDocs(
        query(
          collection(db, 'walletTransactions'),
          where('userId', '==', userId),
          where('type', 'in', ['primary_commission', 'secondary_commission'])
        )
      );

      let totalCommission = 0, pendingCommission = 0, donationCommission = 0;
      commissionsSnap.forEach((commissionDoc) => {
        const data = commissionDoc.data();
        if (data.status === 'paid' || data.status === 'completed') {
          totalCommission += data.amount || 0;
          if (data.description?.toLowerCase().includes('donation')) donationCommission += data.amount || 0;
        } else {
          pendingCommission += data.amount || 0;
        }
      });

      const ordersSnap = await getDocs(query(collection(db, 'orders'), where('memberId', '==', userId)));

      setStats({
        totalMembers: membersSnap.size,
        totalCommission,
        pendingCommission,
        totalOrders: ordersSnap.size,
        donationCommission,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchRecentActivities = async () => {
    try {
      const auth = getAuthInstance();
      const userId = auth.currentUser?.uid;
      if (!userId) return;
      const membersSnap = await getDocs(
        query(
          collection(db, 'registeredMembers'),
          where('workingMemberId', '==', userId),
          orderBy('createdAt', 'desc'),
          limit(5)
        )
      );
      const activitiesList = [];
      membersSnap.forEach((activityDoc) => {
        const data = activityDoc.data();
        activitiesList.push({
          id: activityDoc.id,
          title: translations.newMemberRegistered.replace('{name}', data.fullName || 'New Member'),
          description: data.email || '',
          type: 'member',
          createdAt: data.createdAt || new Date().toISOString(),
        });
      });
      setRecentActivities(activitiesList);
    } catch (error) {
      console.error('Error fetching recent activities:', error);
    }
  };

  // ===== Referral =====
  const generateReferralCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    return code;
  };

  const handleGenerateReferral = async () => {
    const auth = getAuthInstance();
    const userId = auth.currentUser?.uid;
    if (!userId) {
      Alert.alert('Error', 'You must be logged in to generate a referral code');
      return;
    }
    setGeneratingReferral(true);
    try {
      const newCode = generateReferralCode();
      setReferralCode(newCode);
      await updateDoc(doc(db, 'users', userId), {
        referralCode: newCode,
        referralCodeGeneratedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      Alert.alert('Success', `Your referral code: ${newCode}`);
    } catch (error) {
      console.error('Error generating referral code:', error);
      Alert.alert('Error', 'Failed to generate referral code. Please try again.');
    } finally {
      setGeneratingReferral(false);
    }
  };

  const handleShareReferral = async () => {
    if (!referralCode) { Alert.alert('Error', 'Please generate a referral code first'); return; }
    const message = translations.referralMessage.replace('{code}', referralCode);
    try { await Share.share({ message, title: 'Referral Code' }); }
    catch (e) { console.error('Error sharing referral code:', e); }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDynamicLevels();
    await fetchUserData();
    await fetchStats();
    await fetchRecentActivities();
    await fetchPendingApplications();
    await fetchPromotionProgress();
    await fetchReferredMembers();
    await fetchDownlineData();
    await fetchUplineChain();
    setRefreshing(false);
  };

  // ===== Reusable UI bits =====
  const QuickActionButton = ({ title, icon, onPress, badge }) => (
    <TouchableOpacity style={styles.quickActionButton} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.quickActionIconBg}>
        <MaterialIcons name={icon} size={24} color="#ffffff" />
        {badge > 0 && (
          <View style={styles.badgeContainer}><Text style={styles.badgeText}>{badge}</Text></View>
        )}
      </View>
      <Text style={styles.quickActionText}>{title}</Text>
    </TouchableOpacity>
  );

  const StatCard = ({ title, value, icon, color }) => (
    <View style={styles.statCard}>
      <View style={styles.statContent}>
        <Text style={styles.statTitle}>{title}</Text>
        <Text style={styles.statValue}>{value}</Text>
      </View>
      <View style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>
        <MaterialIcons name={icon} size={20} color={color} />
      </View>
    </View>
  );

  const ActivityItem = ({ item }) => (
    <View style={styles.activityItem}>
      <View style={styles.activityItemLeft}>
        <View
          style={[
            styles.activityItemIcon,
            { backgroundColor: item.type === 'member' ? '#3b82f615' : '#10b98115' },
          ]}
        >
          <MaterialIcons
            name={item.type === 'member' ? 'person-add' : 'event'}
            size={16}
            color={item.type === 'member' ? '#3b82f6' : '#10b981'}
          />
        </View>
        <View>
          <Text style={styles.activityItemTitle}>{item.title || translations.activity}</Text>
          <Text style={styles.activityItemSubtitle}>{item.description || ''}</Text>
        </View>
      </View>
      <Text style={styles.activityItemDate}>
        {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : translations.nA}
      </Text>
    </View>
  );

  const LevelProgressBar = () => {
    if (!levelProgress || !levelDetails) return null;
    const nextLevel = levelProgress.nextLevel;
    const remainingDonations = levelProgress.remainingDonations || 0;
    const donationProgress = levelProgress.donationProgress || 0;
    const isEligible = promotionData?.isEligible || false;
    const requiredDonations = levelProgress.requiredDonations || 0;
    const nextLevelTitle = levelProgress.nextLevelTitle || 'Next Level';

    return (
      <View style={styles.levelCard}>
        <View style={styles.levelHeader}>
          <View style={styles.levelBadgeContainer}>
            <Text style={styles.levelBadgeEmoji}>{levelDetails.badge || '⭐'}</Text>
            <Text style={styles.levelTitle}>{levelDetails.title}</Text>
          </View>
        </View>

        {nextLevel && requiredDonations > 0 ? (
          <View style={styles.progressSection}>
            <View style={styles.progressLabelContainer}>
              <Text style={styles.progressLabel}>{translations.donationsProgress}</Text>
              <Text style={styles.progressPercentage}>{Math.round(Math.min(donationProgress, 100))}%</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${Math.min(donationProgress, 100)}%`, backgroundColor: '#f59e0b' }]} />
            </View>
            <Text style={styles.progressSubtext}>
              ₹{totalDonations.toLocaleString()} / ₹{requiredDonations.toLocaleString()}{' '}
              {translations.neededForNextLevel.replace('{level}', nextLevelTitle)}
            </Text>
          </View>
        ) : nextLevel && requiredDonations === 0 ? (
          <View style={styles.progressSection}>
            <Text style={styles.progressLabel}>{translations.noDonationTarget}</Text>
          </View>
        ) : null}

        {nextLevel ? (
          <View style={styles.nextLevelInfo}>
            <Text style={styles.nextLevelText}>
              {remainingDonations > 0
                ? translations.moreInDonationsNeeded.replace('{amount}', remainingDonations.toLocaleString())
                : translations.readyForPromotion}{' '}
              {translations.toReach}{' '}
              <Text style={[styles.nextLevelHighlight, { color: levelDetails.color }]}>{nextLevelTitle}</Text>
            </Text>
            {isEligible && (
              <View style={styles.eligibleBadge}>
                <MaterialIcons name="stars" size={16} color="#10b981" />
                <Text style={styles.eligibleText}>{translations.eligibleForPromotion}</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.maxLevelContainer}>
            <MaterialIcons name="emoji-events" size={20} color="#fbbf24" />
            <Text style={styles.maxLevelText}>{translations.highestLevelReached}</Text>
          </View>
        )}

        <View style={styles.memberCountContainer}>
          <View style={styles.memberCountItem}>
            <Text style={styles.memberCountNumber}>{userData?.directReferrals?.length || 0}</Text>
            <Text style={styles.memberCountLabel}>{translations.directMembers}</Text>
          </View>
          <View style={styles.memberCountDivider} />
          <View style={styles.memberCountItem}>
            <Text style={styles.memberCountNumber}>{stats.totalMembers}</Text>
            <Text style={styles.memberCountLabel}>{translations.totalMembers}</Text>
          </View>
          <View style={styles.memberCountDivider} />
          <View style={styles.memberCountItem}>
            <Text style={[styles.memberCountNumber, { color: '#f59e0b' }]}>₹{totalDonations.toLocaleString()}</Text>
            <Text style={styles.memberCountLabel}>{translations.totalDonations}</Text>
          </View>
        </View>
      </View>
    );
  };

  const WalletCard = () => {
    if (!walletData) return null;
    return (
      <TouchableOpacity style={styles.walletCard} onPress={() => navigation.navigate('Wallet')} activeOpacity={0.7}>
        <View style={styles.walletHeader}>
          <View style={styles.walletHeaderLeft}>
            <MaterialIcons name="account-balance-wallet" size={20} color="#10b981" />
            <Text style={styles.walletTitle}>{translations.walletTitle}</Text>
          </View>
          <MaterialIcons name="chevron-right" size={20} color="#9ca3af" />
        </View>
        <View style={styles.walletContent}>
          <View style={styles.walletBalance}>
            <Text style={styles.walletBalanceLabel}>{translations.availableBalance}</Text>
            <Text style={styles.walletBalanceAmount}>₹{walletData.balance?.toLocaleString() || 0}</Text>
          </View>
          <View style={styles.walletStats}>
            <View style={styles.walletStat}>
              <Text style={styles.walletStatValue}>₹{walletData.totalEarned?.toLocaleString() || 0}</Text>
              <Text style={styles.walletStatLabel}>{translations.totalEarned}</Text>
            </View>
            <View style={styles.walletStatDivider} />
            <View style={styles.walletStat}>
              <Text style={styles.walletStatValue}>₹{walletData.pendingCommission?.toLocaleString() || 0}</Text>
              <Text style={styles.walletStatLabel}>{translations.pendingLabel}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const ReferralCard = () => (
    <TouchableOpacity style={styles.referralCard} onPress={() => setReferralModalVisible(true)} activeOpacity={0.7}>
      <View style={styles.referralHeader}>
        <View style={styles.referralHeaderLeft}>
          <MaterialIcons name="share" size={20} color="#f59e0b" />
          <Text style={styles.referralTitle}>{translations.referralTitle}</Text>
        </View>
        <MaterialIcons name="chevron-right" size={20} color="#9ca3af" />
      </View>
      <View style={styles.referralContent}>
        {referralCode ? (
          <>
            <Text style={styles.referralCodeDisplay}>{referralCode}</Text>
            <Text style={styles.referralSubtext}>{translations.referralSubtext}</Text>
          </>
        ) : (
          <>
            <Text style={styles.referralNoCode}>{translations.noReferralCode}</Text>
            <Text style={styles.referralSubtext}>{translations.referralSubtext}</Text>
          </>
        )}
      </View>
    </TouchableOpacity>
  );

  const ReferralModal = () => (
    <Modal animationType="slide" transparent visible={referralModalVisible} onRequestClose={() => setReferralModalVisible(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.referralModalContainer}>
          <View style={styles.referralModalHeader}>
            <Text style={styles.referralModalTitle}>{translations.referralTitle}</Text>
            <TouchableOpacity onPress={() => setReferralModalVisible(false)}>
              <MaterialIcons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <View style={styles.referralModalContent}>
            {referralCode ? (
              <>
                <Text style={styles.referralModalLabel}>{translations.yourReferralCode}</Text>
                <View style={styles.referralCodeContainer}>
                  <Text style={styles.referralCodeLarge}>{referralCode}</Text>
                </View>
                <Text style={styles.referralModalSubtext}>{translations.referralSubtext}</Text>
                <View style={styles.referralModalButtons}>
                  <TouchableOpacity style={[styles.referralModalButton, styles.referralShareButton]} onPress={handleShareReferral}>
                    <MaterialIcons name="share" size={20} color="#ffffff" />
                    <Text style={styles.referralModalButtonText}>{translations.shareCode}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.referralModalButton, styles.referralCopyButton]}
                    onPress={() => Alert.alert('Copy Code', `Referral code: ${referralCode}`)}
                  >
                    <MaterialIcons name="content-copy" size={20} color="#ffffff" />
                    <Text style={styles.referralModalButtonText}>{translations.copyCode}</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.referralModalNoCode}>{translations.noReferralCode}</Text>
                <Text style={styles.referralModalSubtext}>{translations.referralSubtext}</Text>
                <TouchableOpacity
                  style={[styles.referralGenerateButtonLarge, generatingReferral && { opacity: 0.6 }]}
                  onPress={handleGenerateReferral}
                  disabled={generatingReferral}
                >
                  {generatingReferral ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <MaterialIcons name="refresh" size={20} color="#ffffff" />
                      <Text style={styles.referralGenerateButtonText}>{translations.generateReferral}</Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
          <TouchableOpacity style={styles.referralModalClose} onPress={() => setReferralModalVisible(false)}>
            <Text style={styles.referralModalCloseText}>{translations.closeButton}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // Compact "registered members" modal (existing behavior)
  const NodeMembersModal = () => (
    <Modal
      animationType="slide"
      transparent
      visible={nodeMembersModalVisible}
      onRequestClose={() => setNodeMembersModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.nodeMembersModalContainer}>
          <View style={styles.nodeMembersModalHeader}>
            <View>
              <Text style={styles.nodeMembersModalTitle}>Direct Members</Text>
              <Text style={styles.nodeMembersModalSubtitle}>
                {selectedNodeName || 'Member'} has registered {selectedNodeMembers.length} members
              </Text>
            </View>
            <TouchableOpacity onPress={() => setNodeMembersModalVisible(false)}>
              <MaterialIcons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {loadingNodeMembers ? (
            <View style={styles.nodeMembersLoading}>
              <ActivityIndicator size="large" color="#8b5cf6" />
              <Text style={styles.nodeMembersLoadingText}>Loading members...</Text>
            </View>
          ) : selectedNodeMembers.length === 0 ? (
            <View style={styles.nodeMembersEmpty}>
              <MaterialIcons name="people-outline" size={50} color="#d1d5db" />
              <Text style={styles.nodeMembersEmptyTitle}>No Direct Members</Text>
              <Text style={styles.nodeMembersEmptySubtext}>
                {selectedNodeName || 'This member'} hasn't registered any direct members yet
              </Text>
            </View>
          ) : (
            <FlatList
              data={selectedNodeMembers}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.nodeMemberItem}>
                  <View style={styles.nodeMemberAvatar}>
                    <Text style={styles.nodeMemberAvatarText}>
                      {item.fullName?.charAt(0)?.toUpperCase() || '?'}
                    </Text>
                  </View>
                  <View style={styles.nodeMemberInfo}>
                    <Text style={styles.nodeMemberName}>{item.fullName || 'Unknown'}</Text>
                    <Text style={styles.nodeMemberDetails}>{item.phone || item.email || 'No contact'}</Text>
                    <View style={styles.nodeMemberMeta}>
                      <View
                        style={[
                          styles.nodeMemberStatus,
                          { backgroundColor: item.status === 'active' ? '#d1fae5' : '#fee2e2' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.nodeMemberStatusText,
                            { color: item.status === 'active' ? '#10b981' : '#ef4444' },
                          ]}
                        >
                          {item.status || 'inactive'}
                        </Text>
                      </View>
                      {item.level && <Text style={styles.nodeMemberLevel}>Level {item.level}</Text>}
                    </View>
                  </View>
                  <MaterialIcons name="chevron-right" size={20} color="#d1d5db" />
                </View>
              )}
              contentContainerStyle={styles.nodeMembersList}
              showsVerticalScrollIndicator={false}
            />
          )}

          <TouchableOpacity
            style={styles.nodeMembersCloseButton}
            onPress={() => setNodeMembersModalVisible(false)}
          >
            <Text style={styles.nodeMembersCloseButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // ===== NEW: Working Member Detail modal =====
  const WorkingMemberDetailModal = () => {
    const filteredRegistered = wmRegisteredMembers.filter((m) => {
      if (!wmMembersSearch) return true;
      const q = wmMembersSearch.toLowerCase();
      return (
        m.fullName?.toLowerCase().includes(q) ||
        m.email?.toLowerCase().includes(q) ||
        m.phone?.includes(wmMembersSearch)
      );
    });

    const levelColor = wmDetail ? wmDetail.levelColor || getLevelColor(wmDetail.level) : '#8b5cf6';
    const levelName = wmDetail
      ? wmDetail.levelName || getLevelLabel(wmDetail.level, dynamicLevels) || wmDetail.level
      : 'I';

    return (
      <Modal
        animationType="slide"
        transparent
        visible={wmDetailModalVisible}
        onRequestClose={() => setWmDetailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.wmDetailModalContainer}>
            {/* Header */}
            <View style={styles.wmDetailHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <View style={[styles.wmDetailAvatar, { backgroundColor: levelColor + '20' }]}>
                  {wmDetail?.profilePhoto ? (
                    <Image source={{ uri: wmDetail.profilePhoto }} style={{ width: 56, height: 56, borderRadius: 28 }} />
                  ) : (
                    <Text style={[styles.wmDetailAvatarText, { color: levelColor }]}>
                      {wmDetail?.fullName?.charAt(0)?.toUpperCase() || '?'}
                    </Text>
                  )}
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.wmDetailName} numberOfLines={1}>{wmDetail?.fullName || 'Unknown'}</Text>
                  <View style={styles.wmDetailBadgeRow}>
                    <View style={[styles.wmDetailLevelBadge, { backgroundColor: levelColor + '20' }]}>
                      <MaterialIcons name="star" size={12} color={levelColor} />
                      <Text style={[styles.wmDetailLevelText, { color: levelColor }]}>Level {levelName}</Text>
                    </View>
                    <View
                      style={[
                        styles.wmDetailStatusBadge,
                        { backgroundColor: wmDetail?.status === 'active' ? '#d1fae5' : '#fee2e2' },
                      ]}
                    >
                      <Text
                        style={{
                          fontFamily: Fonts.SemiBold,
                          fontSize: 10,
                          color: wmDetail?.status === 'active' ? '#10b981' : '#ef4444',
                        }}
                      >
                        {wmDetail?.status || 'inactive'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
              <TouchableOpacity onPress={() => setWmDetailModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {wmDetailLoading ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#8b5cf6" />
                <Text style={styles.nodeMembersLoadingText}>{translations.loadingDetails}</Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                <Text style={styles.wmDetailSectionTitle}>{translations.commissionDetails}</Text>

                <View style={styles.wmCommissionRow}>
                  <View style={styles.wmCommissionCard}>
                    <Text style={styles.wmCommissionLabel}>{translations.totalCommission}</Text>
                    <Text style={[styles.wmCommissionValue, { color: '#10b981' }]}>
                      ₹{wmCommission.total.toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.wmCommissionCard}>
                    <Text style={styles.wmCommissionLabel}>{translations.pendingCommission}</Text>
                    <Text style={[styles.wmCommissionValue, { color: '#f59e0b' }]}>
                      ₹{wmCommission.pending.toLocaleString()}
                    </Text>
                  </View>
                </View>

                <View style={styles.wmCommissionRow}>
                  <View style={styles.wmCommissionCard}>
                    <Text style={styles.wmCommissionLabel}>{translations.donationCommission}</Text>
                    <Text style={[styles.wmCommissionValue, { color: '#8b5cf6' }]}>
                      ₹{wmCommission.donation.toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.wmCommissionCard}>
                    <Text style={styles.wmCommissionLabel}>{translations.totalDonationAmount}</Text>
                    <Text style={[styles.wmCommissionValue, { color: '#ef4444' }]}>
                      ₹{wmDonations.toLocaleString()}
                    </Text>
                  </View>
                </View>

                <Text style={styles.wmDetailSectionTitle}>{translations.personalDetails}</Text>
                <View style={styles.wmInfoCard}>
                  <View style={styles.wmInfoRow}>
                    <MaterialIcons name="phone" size={16} color="#6b7280" />
                    <Text style={styles.wmInfoLabel}>{translations.phone}</Text>
                    <Text style={styles.wmInfoValue}>{wmDetail?.phone || '—'}</Text>
                  </View>
                  <View style={styles.wmInfoRow}>
                    <MaterialIcons name="email" size={16} color="#6b7280" />
                    <Text style={styles.wmInfoLabel}>{translations.email}</Text>
                    <Text style={styles.wmInfoValue}>{wmDetail?.email || '—'}</Text>
                  </View>
                  <View style={styles.wmInfoRow}>
                    <MaterialIcons name="location-on" size={16} color="#6b7280" />
                    <Text style={styles.wmInfoLabel}>{translations.address}</Text>
                    <Text style={styles.wmInfoValue} numberOfLines={2}>{wmDetail?.address || '—'}</Text>
                  </View>
                  <View style={styles.wmInfoRow}>
                    <MaterialIcons name="calendar-today" size={16} color="#6b7280" />
                    <Text style={styles.wmInfoLabel}>{translations.joinedOn}</Text>
                    <Text style={styles.wmInfoValue}>
                      {wmDetail?.createdAt
                        ? new Date(
                            wmDetail.createdAt?.seconds * 1000 || wmDetail.createdAt
                          ).toLocaleDateString()
                        : '—'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.wmDetailSectionTitle}>
                  {translations.registeredMembersList} ({wmRegisteredMembers.length})
                </Text>

                {wmRegisteredMembers.length > 0 && (
                  <View style={styles.wmSearchBox}>
                    <MaterialIcons name="search" size={16} color="#9ca3af" />
                    <TextInput
                      style={styles.wmSearchInput}
                      placeholder={translations.searchRegistered}
                      placeholderTextColor="#9ca3af"
                      value={wmMembersSearch}
                      onChangeText={setWmMembersSearch}
                    />
                    {wmMembersSearch.length > 0 && (
                      <TouchableOpacity onPress={() => setWmMembersSearch('')}>
                        <MaterialIcons name="close" size={16} color="#9ca3af" />
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {filteredRegistered.length === 0 ? (
                  <View style={styles.wmEmptyRegistered}>
                    <MaterialIcons name="people-outline" size={44} color="#d1d5db" />
                    <Text style={styles.wmEmptyRegisteredText}>
                      {wmMembersSearch ? 'No matches' : translations.noRegisteredMembers}
                    </Text>
                  </View>
                ) : (
                  filteredRegistered.map((m) => (
                    <View key={m.id} style={styles.wmMemberRow}>
                      <View style={styles.wmMemberAvatar}>
                        <Text style={styles.wmMemberAvatarText}>
                          {m.fullName?.charAt(0)?.toUpperCase() || '?'}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.wmMemberName} numberOfLines={1}>{m.fullName || 'Unknown'}</Text>
                        <Text style={styles.wmMemberMeta} numberOfLines={1}>
                          {m.email || m.phone || '—'}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.wmMemberBadge,
                          { backgroundColor: m.status === 'active' ? '#d1fae5' : '#fee2e2' },
                        ]}
                      >
                        <Text
                          style={{
                            fontFamily: Fonts.SemiBold,
                            fontSize: 9,
                            color: m.status === 'active' ? '#10b981' : '#ef4444',
                          }}
                        >
                          {m.status || 'inactive'}
                        </Text>
                      </View>
                    </View>
                  ))
                )}
              </ScrollView>
            )}

            <TouchableOpacity
              style={styles.wmDetailCloseButton}
              onPress={() => setWmDetailModalVisible(false)}
            >
              <Text style={styles.wmDetailCloseButtonText}>{translations.closeButton}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer} key={renderKey}>
        <Text style={styles.loadingText}>{translations.loading}</Text>
      </View>
    );
  }

  const firstName = userData?.fullName?.split(' ')[0] || userData?.name?.split(' ')[0] || translations.workingMember;

  return (
    <View style={{ flex: 1 }} key={renderKey}>
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#8b5cf6']} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>{translations.hi}, {firstName}</Text>
              <Text style={styles.subGreeting}>{translations.subGreeting}</Text>
            </View>
            <TouchableOpacity style={styles.profileIcon} onPress={() => navigation.navigate('WorkingMemberProfile')} activeOpacity={0.7}>
              {profilePhoto ? (
                <Image source={{ uri: profilePhoto }} style={styles.profileImage} />
              ) : (
                <MaterialIcons name="person" size={28} color="#8b5cf6" />
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.quickActionsRow}>
            <QuickActionButton title={translations.members} icon="people" onPress={() => navigation.navigate('WorkingMemberRegisteredMembers')} />
            <QuickActionButton title={translations.shop} icon="shopping-cart" onPress={() => navigation.navigate('Shop')} />
            <QuickActionButton title={translations.events} icon="event" onPress={() => navigation.navigate('Events')} />
            <QuickActionButton title={translations.wallet} icon="account-balance-wallet" onPress={() => navigation.navigate('Wallet')} />
            <QuickActionButton title={translations.referral} icon="share" onPress={() => setReferralModalVisible(true)} badge={referralCode ? 0 : 1} />
          </View>
        </View>

        <LevelProgressBar />

        <View style={styles.statsGrid}>
          <StatCard title={translations.membersLabel} value={stats.totalMembers} icon="people" color="#8b5cf6" />
          <StatCard title={translations.commission} value={`₹${stats.totalCommission.toLocaleString()}`} icon="attach-money" color="#10b981" />
          <StatCard title={translations.pending} value={`₹${stats.pendingCommission.toLocaleString()}`} icon="pending" color="#f59e0b" />
          <StatCard title={translations.orders} value={stats.totalOrders} icon="shopping-bag" color="#3b82f6" />
        </View>

        <ReferralCard />
        <WalletCard />

        {/* ⬆️ UPLINE */}
        <View style={styles.treeSection}>
          <View style={styles.treeSectionHeader}>
            <View style={styles.treeSectionLeft}>
              <MaterialIcons name="arrow-upward" size={20} color="#f59e0b" />
              <Text style={styles.treeSectionTitle}>{translations.uplineTitle}</Text>
            </View>
            <Text style={styles.treeSectionSubtitle}>
              {uplineChain.length} {uplineChain.length === 1 ? 'member' : 'members'}
            </Text>
          </View>

          {loadingUpline ? (
            <View style={styles.treeLoadingContainer}>
              <ActivityIndicator size="small" color="#f59e0b" />
              <Text style={styles.treeLoadingText}>Loading upline...</Text>
            </View>
          ) : uplineChain.length === 0 ? (
            <View style={styles.treeEmptyContainer}>
              <MaterialIcons name="person-outline" size={40} color="#d1d5db" />
              <Text style={styles.treeEmptyTitle}>No Upline</Text>
              <Text style={styles.treeEmptySubtext}>{translations.noUpline}</Text>
            </View>
          ) : (
            <View style={{ padding: 8 }}>
              {uplineChain.map((upline, index) => (
                <TouchableOpacity
                  key={upline.id}
                  style={styles.uplineCard}
                  onPress={() => openWorkingMemberDetail(upline)}
                  activeOpacity={0.7}
                >
                  <View style={styles.uplineIndexBadge}>
                    <Text style={styles.uplineIndexText}>{index + 1}</Text>
                  </View>
                  <View style={styles.uplineAvatarWrap}>
                    {upline.profilePhoto ? (
                      <Image source={{ uri: upline.profilePhoto }} style={styles.uplineAvatarImg} />
                    ) : (
                      <Text style={styles.uplineAvatarLetter}>
                        {upline.fullName?.charAt(0)?.toUpperCase() || '?'}
                      </Text>
                    )}
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.uplineName} numberOfLines={1}>{upline.fullName || 'Unknown'}</Text>
                    <Text style={styles.uplineMeta} numberOfLines={1}>
                      Level {upline.levelName || upline.level || 'I'} · {upline.status || 'active'}
                    </Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={20} color="#d1d5db" />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* ⬇️ DOWNLINE */}
        <View style={styles.treeSection}>
          <View style={styles.treeSectionHeader}>
            <View style={styles.treeSectionLeft}>
              <MaterialIcons name="arrow-downward" size={20} color="#8b5cf6" />
              <Text style={styles.treeSectionTitle}>{translations.downlineTitle}</Text>
            </View>
            <Text style={styles.treeSectionSubtitle}>
              {downlineStats.workingMembers} {translations.workingMembers}
            </Text>
          </View>
          <VisualTree />
        </View>

        {/* Referred members list */}
        <View style={styles.recentSection}>
          <View style={styles.recentHeader}>
            <Text style={styles.recentTitle}>My Referred Members</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Members')} activeOpacity={0.7}>
              <Text style={styles.viewAllText}>{translations.viewAll}</Text>
            </TouchableOpacity>
          </View>
          {loadingReferred ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="small" color="#8b5cf6" />
              <Text style={styles.emptyStateText}>Loading...</Text>
            </View>
          ) : referredMembers.length > 0 ? (
            referredMembers.slice(0, 5).map((member, index) => (
              <View key={index} style={styles.activityItem}>
                <View style={styles.activityItemLeft}>
                  <View style={[styles.activityItemIcon, { backgroundColor: '#8b5cf615' }]}>
                    <MaterialIcons name="person" size={16} color="#8b5cf6" />
                  </View>
                  <View>
                    <Text style={styles.activityItemTitle}>{member.fullName}</Text>
                    <Text style={styles.activityItemSubtitle}>
                      {member.phone} • {member.status || 'Active'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.activityItemDate}>
                  {member.createdAt ? new Date(member.createdAt).toLocaleDateString() : 'N/A'}
                </Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No referred members yet</Text>
              <Text style={styles.emptyStateSubtext}>Share your referral code to get started!</Text>
            </View>
          )}
        </View>

        {/* Recent registrations */}
        <View style={styles.recentSection}>
          <View style={styles.recentHeader}>
            <Text style={styles.recentTitle}>{translations.recentRegistrations}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Members')} activeOpacity={0.7}>
              <Text style={styles.viewAllText}>{translations.viewAll}</Text>
            </TouchableOpacity>
          </View>
          {recentActivities.length > 0 ? (
            recentActivities.map((item, index) => <ActivityItem key={index} item={item} />)
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>{translations.noRecentRegistrations}</Text>
            </View>
          )}
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Quick actions FAB modal */}
      <Modal animationType="fade" transparent visible={fabModalVisible} onRequestClose={() => setFabModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setFabModalVisible(false)}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{translations.quickActions}</Text>
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => { setFabModalVisible(false); navigation.navigate('WorkingMemberApplications'); }}
                activeOpacity={0.7}
              >
                <View style={[styles.modalItemIcon, { backgroundColor: '#8b5cf6' }]}>
                  <MaterialIcons name="handshake" size={22} color="#ffffff" />
                </View>
                <View style={styles.modalItemTextContainer}>
                  <Text style={styles.modalItemTitle}>{translations.applications}</Text>
                  <Text style={styles.modalItemSubtitle}>{translations.applyForServices}</Text>
                </View>
                {pendingApplications > 0 && (
                  <View style={styles.pendingBadge}><Text style={styles.pendingBadgeText}>{pendingApplications}</Text></View>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => { setFabModalVisible(false); navigation.navigate('WorkingMemberEvents'); }}
                activeOpacity={0.7}
              >
                <View style={[styles.modalItemIcon, { backgroundColor: '#3b82f6' }]}>
                  <MaterialIcons name="event" size={22} color="#ffffff" />
                </View>
                <View style={styles.modalItemTextContainer}>
                  <Text style={styles.modalItemTitle}>{translations.eventsLabel}</Text>
                  <Text style={styles.modalItemSubtitle}>{translations.viewEvents}</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => { setFabModalVisible(false); navigation.navigate('Wallet'); }}
                activeOpacity={0.7}
              >
                <View style={[styles.modalItemIcon, { backgroundColor: '#10b981' }]}>
                  <MaterialIcons name="account-balance-wallet" size={22} color="#ffffff" />
                </View>
                <View style={styles.modalItemTextContainer}>
                  <Text style={styles.modalItemTitle}>{translations.walletLabel}</Text>
                  <Text style={styles.modalItemSubtitle}>{translations.viewWalletBalance}</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => { setFabModalVisible(false); navigation.navigate('WorkingMemberNotice'); }}
                activeOpacity={0.7}
              >
                <View style={[styles.modalItemIcon, { backgroundColor: '#8b5cf6' }]}>
                  <MaterialIcons name="announcement" size={22} color="#ffffff" />
                </View>
                <View style={styles.modalItemTextContainer}>
                  <Text style={styles.modalItemTitle}>{translations.viewNotices}</Text>
                  <Text style={styles.modalItemSubtitle}>{translations.checkUpdates}</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => { setFabModalVisible(false); navigation.navigate('WorkingMemberComplaint'); }}
                activeOpacity={0.7}
              >
                <View style={[styles.modalItemIcon, { backgroundColor: '#ef4444' }]}>
                  <MaterialIcons name="report-problem" size={22} color="#ffffff" />
                </View>
                <View style={styles.modalItemTextContainer}>
                  <Text style={styles.modalItemTitle}>{translations.submitComplaint}</Text>
                  <Text style={styles.modalItemSubtitle}>{translations.reportIssue}</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => { setFabModalVisible(false); navigation.navigate('WorkingMemberSuggestion'); }}
                activeOpacity={0.7}
              >
                <View style={[styles.modalItemIcon, { backgroundColor: '#f59e0b' }]}>
                  <MaterialIcons name="lightbulb" size={22} color="#ffffff" />
                </View>
                <View style={styles.modalItemTextContainer}>
                  <Text style={styles.modalItemTitle}>{translations.submitSuggestion}</Text>
                  <Text style={styles.modalItemSubtitle}>{translations.shareIdeas}</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => { setFabModalVisible(false); navigation.navigate('WorkingMemberCompany'); }}
                activeOpacity={0.7}
              >
                <View style={[styles.modalItemIcon, { backgroundColor: '#10b981' }]}>
                  <MaterialIcons name="business" size={22} color="#ffffff" />
                </View>
                <View style={styles.modalItemTextContainer}>
                  <Text style={styles.modalItemTitle}>{translations.companyInfo}</Text>
                  <Text style={styles.modalItemSubtitle}>{translations.viewCompanyDetails}</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalCloseButton} onPress={() => setFabModalVisible(false)} activeOpacity={0.7}>
                <Text style={styles.modalCloseButtonText}>{translations.closeButton}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      <ReferralModal />
      <NodeMembersModal />
      <WorkingMemberDetailModal />
    </View>
  );
}

const styles = StyleSheet.create({
  // ===== Base =====
  container: { flex: 1, backgroundColor: '#f8fafc' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  loadingText: { fontFamily: Fonts.Regular, fontSize: 14, color: '#6b7280' },

  // ===== Header =====
  headerCard: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 16,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  greeting: { fontFamily: Fonts.Bold, fontSize: 22, color: '#ffffff', marginBottom: 4 },
  subGreeting: { fontFamily: Fonts.Regular, fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  profileIcon: {
    width: 64, height: 64, borderRadius: 40, backgroundColor: '#ffffff',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 2, overflow: 'hidden',
  },
  profileImage: { width: 64, height: 64, borderRadius: 40 },

  quickActionsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 4 },
  quickActionButton: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 4 },
  quickActionIconBg: {
    width: 38, height: 38, borderRadius: 10, backgroundColor: '#7c3aed',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 4, elevation: 3, position: 'relative',
  },
  badgeContainer: {
    position: 'absolute', top: -6, right: -6, backgroundColor: '#ef4444',
    borderRadius: 10, paddingHorizontal: 4, paddingVertical: 2, minWidth: 18,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#8b5cf6',
  },
  badgeText: { fontFamily: Fonts.SemiBold, fontSize: 9, color: '#ffffff' },
  quickActionText: { fontFamily: Fonts.SemiBold, color: '#ffffff', fontSize: 9, marginTop: 3, textAlign: 'center' },

  // ===== Level card =====
  levelCard: {
    backgroundColor: '#ffffff', borderRadius: 14, padding: 16,
    marginHorizontal: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 3,
    borderWidth: 1, borderColor: '#e5e7eb',
  },
  levelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  levelBadgeContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  levelBadgeEmoji: { fontSize: 22 },
  levelTitle: { fontFamily: Fonts.Bold, fontSize: 18, color: '#1f2937' },
  progressSection: { marginBottom: 8 },
  progressLabelContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  progressLabel: { fontFamily: Fonts.Regular, fontSize: 11, color: '#6b7280' },
  progressPercentage: { fontFamily: Fonts.SemiBold, fontSize: 11, color: '#1f2937' },
  progressBar: { height: 6, backgroundColor: '#f3f4f6', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  progressSubtext: { fontFamily: Fonts.Regular, fontSize: 10, color: '#6b7280', marginTop: 2 },
  nextLevelInfo: { marginTop: 4, marginBottom: 10 },
  nextLevelText: { fontFamily: Fonts.Regular, fontSize: 12, color: '#6b7280' },
  nextLevelHighlight: { fontFamily: Fonts.SemiBold },
  eligibleBadge: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#d1fae5',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, gap: 4,
    alignSelf: 'flex-start', marginTop: 4,
  },
  eligibleText: { fontFamily: Fonts.SemiBold, fontSize: 11, color: '#10b981' },
  maxLevelContainer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    marginTop: 4, marginBottom: 10, paddingVertical: 6,
    backgroundColor: '#fef3c7', borderRadius: 8,
  },
  maxLevelText: { fontFamily: Fonts.SemiBold, fontSize: 13, color: '#92400e' },
  memberCountContainer: {
    flexDirection: 'row', justifyContent: 'space-around',
    paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f3f4f6',
  },
  memberCountItem: { alignItems: 'center' },
  memberCountNumber: { fontFamily: Fonts.Bold, fontSize: 18, color: '#1f2937' },
  memberCountLabel: { fontFamily: Fonts.Regular, fontSize: 10, color: '#6b7280', marginTop: 2 },
  memberCountDivider: { width: 1, backgroundColor: '#e5e7eb' },

  // ===== Stats =====
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 12 },
  statCard: {
    backgroundColor: '#ffffff', borderRadius: 12, padding: 14, width: '48%', marginBottom: 10,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
    borderWidth: 1, borderColor: '#e5e7eb',
  },
  statContent: { flex: 1 },
  statTitle: { fontFamily: Fonts.Regular, fontSize: 11, color: '#6b7280', marginBottom: 2 },
  statValue: { fontFamily: Fonts.Bold, fontSize: 18, color: '#1f2937' },
  statIconContainer: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },

  // ===== Wallet =====
  walletCard: {
    backgroundColor: '#ffffff', borderRadius: 12, padding: 16,
    marginHorizontal: 16, marginBottom: 12,
    borderWidth: 1, borderColor: '#e5e7eb',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
  },
  walletHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  walletHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  walletTitle: { fontFamily: Fonts.SemiBold, fontSize: 16, color: '#1f2937' },
  walletContent: { gap: 8 },
  walletBalance: { alignItems: 'center', paddingVertical: 8, backgroundColor: '#f8fafc', borderRadius: 8 },
  walletBalanceLabel: { fontFamily: Fonts.Regular, fontSize: 12, color: '#6b7280' },
  walletBalanceAmount: { fontFamily: Fonts.Bold, fontSize: 24, color: '#10b981' },
  walletStats: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  walletStat: { alignItems: 'center' },
  walletStatValue: { fontFamily: Fonts.Bold, fontSize: 14, color: '#1f2937' },
  walletStatLabel: { fontFamily: Fonts.Regular, fontSize: 10, color: '#6b7280', marginTop: 2 },
  walletStatDivider: { width: 1, backgroundColor: '#e5e7eb' },

  // ===== Referral card =====
  referralCard: {
    backgroundColor: '#ffffff', borderRadius: 12, padding: 16,
    marginHorizontal: 16, marginBottom: 12,
    borderWidth: 1, borderColor: '#fef3c7',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
  },
  referralHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  referralHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  referralTitle: { fontFamily: Fonts.SemiBold, fontSize: 16, color: '#1f2937' },
  referralContent: { alignItems: 'center', paddingVertical: 4 },
  referralCodeDisplay: { fontFamily: Fonts.Bold, fontSize: 20, color: '#f59e0b', letterSpacing: 2 },
  referralNoCode: { fontFamily: Fonts.SemiBold, fontSize: 14, color: '#6b7280' },
  referralSubtext: { fontFamily: Fonts.Regular, fontSize: 11, color: '#9ca3af', marginTop: 2 },

  // ===== Referral modal =====
  referralModalContainer: {
    backgroundColor: '#ffffff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 40, maxHeight: '80%', marginTop: 'auto',
  },
  referralModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  referralModalTitle: { fontFamily: Fonts.Bold, fontSize: 20, color: '#1f2937' },
  referralModalContent: { alignItems: 'center', paddingVertical: 16 },
  referralModalLabel: { fontFamily: Fonts.SemiBold, fontSize: 14, color: '#6b7280', marginBottom: 8 },
  referralCodeContainer: {
    backgroundColor: '#fef3c7', paddingVertical: 16, paddingHorizontal: 32,
    borderRadius: 12, borderWidth: 2, borderColor: '#f59e0b', marginBottom: 12,
  },
  referralCodeLarge: { fontFamily: Fonts.Bold, fontSize: 28, color: '#f59e0b', letterSpacing: 4 },
  referralModalSubtext: { fontFamily: Fonts.Regular, fontSize: 12, color: '#6b7280', textAlign: 'center', marginBottom: 16 },
  referralModalButtons: { flexDirection: 'row', gap: 12, width: '100%' },
  referralModalButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 8, gap: 8 },
  referralShareButton: { backgroundColor: '#f59e0b' },
  referralCopyButton: { backgroundColor: '#10b981' },
  referralModalButtonText: { fontFamily: Fonts.SemiBold, fontSize: 14, color: '#ffffff' },
  referralModalNoCode: { fontFamily: Fonts.SemiBold, fontSize: 18, color: '#1f2937', marginBottom: 4 },
  referralGenerateButtonLarge: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FF7722', paddingVertical: 14, paddingHorizontal: 24,
    borderRadius: 8, gap: 8, width: '100%', marginTop: 8,
  },
  referralGenerateButtonText: { fontFamily: Fonts.SemiBold, fontSize: 16, color: '#ffffff' },
  referralModalClose: { paddingVertical: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6', marginTop: 12 },
  referralModalCloseText: { fontFamily: Fonts.SemiBold, fontSize: 14, color: '#6b7280' },

  // ===== Recent =====
  recentSection: { paddingHorizontal: 16, marginBottom: 16 },
  recentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  recentTitle: { fontFamily: Fonts.SemiBold, fontSize: 18, color: '#1f2937', letterSpacing: 0.5 },
  viewAllText: { fontFamily: Fonts.SemiBold, fontSize: 13, color: '#8b5cf6' },
  activityItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#ffffff', padding: 12, borderRadius: 10, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
    borderWidth: 1, borderColor: '#e5e7eb',
  },
  activityItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  activityItemIcon: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  activityItemTitle: { fontFamily: Fonts.SemiBold, fontSize: 14, color: '#1f2937' },
  activityItemSubtitle: { fontFamily: Fonts.Regular, fontSize: 12, color: '#6b7280' },
  activityItemDate: { fontFamily: Fonts.Regular, fontSize: 11, color: '#9ca3af' },
  emptyState: { paddingVertical: 20, alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 10 },
  emptyStateText: { fontFamily: Fonts.Regular, fontSize: 13, color: '#9ca3af' },
  emptyStateSubtext: { fontFamily: Fonts.Regular, fontSize: 11, color: '#d1d5db', marginTop: 4 },
  bottomSpacing: { height: 20 },

  // ===== Tree section =====
  treeSection: { paddingHorizontal: 16, marginBottom: 16 },
  treeSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  treeSectionLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  treeSectionTitle: { fontFamily: Fonts.SemiBold, fontSize: 18, color: '#1f2937' },
  treeSectionSubtitle: { fontFamily: Fonts.Regular, fontSize: 12, color: '#6b7280' },

  // Visual tree container
  visualTreeContainer: {
    backgroundColor: '#ffffff', borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: '#e5e7eb',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  treeStatsBar: {
    flexDirection: 'row', backgroundColor: '#f8fafc', borderRadius: 8,
    padding: 10, marginBottom: 12, justifyContent: 'space-around',
    borderWidth: 1, borderColor: '#e5e7eb',
  },
  treeStatItem: { alignItems: 'center', flex: 1 },
  treeStatNumber: { fontFamily: Fonts.Bold, fontSize: 16, color: '#1f2937' },
  treeStatLabel: { fontFamily: Fonts.Regular, fontSize: 9, color: '#6b7280', marginTop: 1 },
  treeStatDivider: { width: 1, backgroundColor: '#e5e7eb' },
  treeRootContainer: { paddingVertical: 4 },
  treeNodeContainer: { alignItems: 'center', width: '100%' },
  treeNodeCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#ffffff', borderRadius: 12, padding: 14, width: '100%',
    borderWidth: 1, borderColor: '#e5e7eb',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2, minHeight: 70,
  },
  treeNodeRoot: { backgroundColor: '#f9fafb' },
  treeNodeDirect: { backgroundColor: '#f0fdf4' },
  treeNodeWorking: { backgroundColor: '#f5f3ff' },
  treeNodeLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  treeNodeLevelBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, minWidth: 45, alignItems: 'center' },
  treeNodeLevelText: { fontFamily: Fonts.SemiBold, fontSize: 9 },
  treeNodeAvatar: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  treeNodeAvatarText: { fontFamily: Fonts.Bold, fontSize: 16 },
  treeNodeInfo: { flex: 1 },
  treeNodeNameRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  treeNodeName: { fontFamily: Fonts.SemiBold, fontSize: 13, color: '#000000' },
  treeNodeNameRoot: { color: '#000000', fontSize: 14 },
  treeNodeRootBadge: { backgroundColor: '#8b5cf6', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6 },
  treeNodeRootBadgeText: { fontFamily: Fonts.SemiBold, fontSize: 8, color: '#ffffff' },
  treeNodeDirectBadge: { backgroundColor: '#10b981', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6 },
  treeNodeDirectBadgeText: { fontFamily: Fonts.SemiBold, fontSize: 7, color: '#ffffff' },
  treeNodeMeta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4, marginTop: 1 },
  treeNodeWorkingBadge: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#8b5cf615',
    paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4, gap: 2,
  },
  treeNodeWorkingText: { fontFamily: Fonts.SemiBold, fontSize: 7, color: '#8b5cf6' },
  treeNodeLevel: { fontFamily: Fonts.Regular, fontSize: 8, color: '#6b7280' },
  treeNodeChildCount: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#8b5cf615',
    paddingHorizontal: 5, paddingVertical: 1, borderRadius: 8, gap: 2,
  },
  treeNodeChildCountText: { fontFamily: Fonts.SemiBold, fontSize: 8, color: '#8b5cf6' },
  treeNodeRight: { alignItems: 'flex-end' },
  treeNodeStatus: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, gap: 3 },
  treeNodeStatusDot: { width: 5, height: 5, borderRadius: 2.5 },
  treeNodeStatusText: { fontFamily: Fonts.SemiBold, fontSize: 7 },
  treeNodeTapHint: { fontFamily: Fonts.Regular, fontSize: 7, color: '#9ca3af', marginTop: 2, textAlign: 'center' },
  treeNodeDirectMemberBadge: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef3c7',
    paddingHorizontal: 5, paddingVertical: 1, borderRadius: 8, gap: 2,
  },
  treeNodeDirectMemberBadgeText: { fontFamily: Fonts.SemiBold, fontSize: 8, color: '#f59e0b' },

  // Tree connectors
  treeNodeChildrenContainer: { alignItems: 'center', width: '100%', marginTop: 2, position: 'relative' },
  treeConnectorLine: { width: 2, height: 12, backgroundColor: '#d1d5db', marginVertical: 2 },
  treeConnectorHorizontal: { width: '80%', height: 2, backgroundColor: '#d1d5db', marginVertical: 2, alignSelf: 'center' },
  treeNodeChildWrapper: { width: '100%', alignItems: 'center', marginTop: 2 },
  treeConnectorVertical: { width: 2, height: 10, backgroundColor: '#d1d5db', marginBottom: 2 },

  // Tree empty / loading
  treeLoadingContainer: {
    backgroundColor: '#ffffff', borderRadius: 12, padding: 30, alignItems: 'center',
    borderWidth: 1, borderColor: '#e5e7eb',
  },
  treeLoadingText: { fontFamily: Fonts.Regular, fontSize: 13, color: '#6b7280', marginTop: 8 },
  treeEmptyContainer: {
    backgroundColor: '#ffffff', borderRadius: 12, padding: 30, alignItems: 'center',
    borderWidth: 1, borderColor: '#e5e7eb',
  },
  treeEmptyTitle: { fontFamily: Fonts.SemiBold, fontSize: 15, color: '#1f2937', marginTop: 8 },
  treeEmptySubtext: { fontFamily: Fonts.Regular, fontSize: 12, color: '#9ca3af', marginTop: 4, textAlign: 'center' },

  // ===== Upline styles =====
  uplineCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fffbeb', borderRadius: 10, padding: 10, marginBottom: 8,
    borderWidth: 1, borderColor: '#fde68a',
  },
  uplineIndexBadge: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: '#f59e0b',
    justifyContent: 'center', alignItems: 'center', marginRight: 8,
  },
  uplineIndexText: { fontFamily: Fonts.Bold, fontSize: 11, color: '#ffffff' },
  uplineAvatarWrap: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#fef3c7',
    justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
  },
  uplineAvatarImg: { width: 36, height: 36, borderRadius: 18 },
  uplineAvatarLetter: { fontFamily: Fonts.Bold, fontSize: 15, color: '#f59e0b' },
  uplineName: { fontFamily: Fonts.SemiBold, fontSize: 14, color: '#1f2937' },
  uplineMeta: { fontFamily: Fonts.Regular, fontSize: 11, color: '#92400e', marginTop: 1 },

  // ===== Modals (shared) =====
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: {
    backgroundColor: '#ffffff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 40, maxHeight: '80%',
  },
  modalContent: { width: '100%' },
  modalTitle: { fontFamily: Fonts.Bold, fontSize: 20, color: '#1f2937', marginBottom: 16, textAlign: 'center' },
  modalItem: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16,
    borderRadius: 12, marginBottom: 8, backgroundColor: '#f9fafb',
  },
  modalItemIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  modalItemTextContainer: { flex: 1 },
  modalItemTitle: { fontFamily: Fonts.SemiBold, fontSize: 16, color: '#1f2937' },
  modalItemSubtitle: { fontFamily: Fonts.Regular, fontSize: 12, color: '#6b7280' },
  pendingBadge: { backgroundColor: '#ef4444', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  pendingBadgeText: { fontFamily: Fonts.SemiBold, fontSize: 11, color: '#ffffff' },
  modalCloseButton: { paddingVertical: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6', marginTop: 8 },
  modalCloseButtonText: { fontFamily: Fonts.SemiBold, fontSize: 14, color: '#6b7280' },

  // ===== Node members modal =====
  nodeMembersModalContainer: {
    backgroundColor: '#ffffff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 40, maxHeight: '80%', marginTop: 'auto', minHeight: 300,
  },
  nodeMembersModalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  nodeMembersModalTitle: { fontFamily: Fonts.Bold, fontSize: 18, color: '#1f2937' },
  nodeMembersModalSubtitle: { fontFamily: Fonts.Regular, fontSize: 12, color: '#6b7280', marginTop: 2 },
  nodeMembersLoading: { paddingVertical: 40, alignItems: 'center' },
  nodeMembersLoadingText: { fontFamily: Fonts.Regular, fontSize: 13, color: '#6b7280', marginTop: 8 },
  nodeMembersEmpty: { paddingVertical: 40, alignItems: 'center' },
  nodeMembersEmptyTitle: { fontFamily: Fonts.SemiBold, fontSize: 16, color: '#1f2937', marginTop: 8 },
  nodeMembersEmptySubtext: { fontFamily: Fonts.Regular, fontSize: 13, color: '#9ca3af', marginTop: 4, textAlign: 'center' },
  nodeMembersList: { paddingBottom: 8 },
  nodeMemberItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb',
    padding: 12, borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: '#f3f4f6',
  },
  nodeMemberAvatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#8b5cf615',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  nodeMemberAvatarText: { fontFamily: Fonts.Bold, fontSize: 16, color: '#8b5cf6' },
  nodeMemberInfo: { flex: 1 },
  nodeMemberName: { fontFamily: Fonts.SemiBold, fontSize: 14, color: '#1f2937' },
  nodeMemberDetails: { fontFamily: Fonts.Regular, fontSize: 12, color: '#6b7280', marginTop: 1 },
  nodeMemberMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  nodeMemberStatus: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  nodeMemberStatusText: { fontFamily: Fonts.SemiBold, fontSize: 10 },
  nodeMemberLevel: { fontFamily: Fonts.Regular, fontSize: 10, color: '#6b7280' },
  nodeMembersCloseButton: { backgroundColor: '#f3f4f6', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 12 },
  nodeMembersCloseButtonText: { fontFamily: Fonts.SemiBold, fontSize: 14, color: '#6b7280' },

  // ===== Working Member Detail modal (NEW) =====
  wmDetailModalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16,
    maxHeight: '90%', marginTop: 'auto',
  },
  wmDetailHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  wmDetailAvatar: {
    width: 56, height: 56, borderRadius: 28,
    justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
  },
  wmDetailAvatarText: { fontFamily: Fonts.Bold, fontSize: 22 },
  wmDetailName: { fontFamily: Fonts.Bold, fontSize: 17, color: '#1f2937' },
  wmDetailBadgeRow: { flexDirection: 'row', gap: 6, marginTop: 4, flexWrap: 'wrap' },
  wmDetailLevelBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10,
  },
  wmDetailLevelText: { fontFamily: Fonts.SemiBold, fontSize: 10 },
  wmDetailStatusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  wmDetailSectionTitle: {
    fontFamily: Fonts.SemiBold, fontSize: 14, color: '#1f2937',
    marginTop: 16, marginBottom: 8,
  },
  wmCommissionRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  wmCommissionCard: {
    flex: 1, backgroundColor: '#f9fafb', borderRadius: 10,
    padding: 12, borderWidth: 1, borderColor: '#f3f4f6',
  },
  wmCommissionLabel: { fontFamily: Fonts.Regular, fontSize: 10, color: '#6b7280', marginBottom: 4 },
  wmCommissionValue: { fontFamily: Fonts.Bold, fontSize: 16 },
  wmInfoCard: { backgroundColor: '#f9fafb', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#f3f4f6' },
  wmInfoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, gap: 8 },
  wmInfoLabel: { fontFamily: Fonts.Regular, fontSize: 11, color: '#6b7280', width: 70 },
  wmInfoValue: { fontFamily: Fonts.SemiBold, fontSize: 12, color: '#1f2937', flex: 1 },
  wmSearchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#f9fafb', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8,
    marginBottom: 10, borderWidth: 1, borderColor: '#e5e7eb',
  },
  wmSearchInput: { flex: 1, fontFamily: Fonts.Regular, fontSize: 13, color: '#1f2937', paddingVertical: 0 },
  wmMemberRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#f9fafb', borderRadius: 10, padding: 10,
    marginBottom: 8, borderWidth: 1, borderColor: '#f3f4f6',
  },
  wmMemberAvatar: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#8b5cf615',
    justifyContent: 'center', alignItems: 'center', marginRight: 10,
  },
  wmMemberAvatarText: { fontFamily: Fonts.Bold, fontSize: 14, color: '#8b5cf6' },
  wmMemberName: { fontFamily: Fonts.SemiBold, fontSize: 13, color: '#1f2937' },
  wmMemberMeta: { fontFamily: Fonts.Regular, fontSize: 11, color: '#6b7280' },
  wmMemberBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  wmEmptyRegistered: { alignItems: 'center', paddingVertical: 24 },
  wmEmptyRegisteredText: { fontFamily: Fonts.Regular, fontSize: 13, color: '#9ca3af', marginTop: 6 },
  wmDetailCloseButton: {
    backgroundColor: '#f3f4f6', paddingVertical: 12, borderRadius: 8,
    alignItems: 'center', marginTop: 12,
  },
  wmDetailCloseButtonText: { fontFamily: Fonts.SemiBold, fontSize: 14, color: '#6b7280' },
});