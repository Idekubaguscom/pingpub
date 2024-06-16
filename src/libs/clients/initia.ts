import type{ RequestRegistry } from '@/libs/registry'
import { adapter } from '@/libs/registry'
import type { GovProposal, PaginatedProposals } from '@/types'
// which registry is store
export const store = 'name' // name or version
// Blockchain Name
export const name = 'Initia-testnet'

function proposalAdapter(p: any): GovProposal {
    if(p) {
        if(p.messages && p.messages.length >= 1) p.content = p.messages[0].content || p.messages[0]
        p.proposal_id = p.id
        p.final_tally_result = {
            yes: p.final_tally_result?.yes_count,
            no: p.final_tally_result?.no_count,
            no_with_veto: p.final_tally_result?.no_with_veto_count,
            abstain: p.final_tally_result?.abstain_count,
        }
    }
    return p
}

export const requests: Partial<RequestRegistry> = {
//    mint_inflation: { url: '/evmos/inflation/v1/inflation_rate', adapter: async (data: any) => ({inflation: (Number(data.inflation_rate || 0)/ 100 ).toFixed(2)}) },
    gov_params_voting: { url: '/cosmos/gov/v1/params/voting', adapter },
    gov_params_tally: { url: '/cosmos/gov/v1/params/tallying', adapter },
    gov_params_deposit: { url: '/cosmos/gov/v1/params/deposit', adapter },
    gov_proposals: { url: '/cosmos/gov/v1/proposals', adapter: async (source: any): Promise<PaginatedProposals> => {
      const proposals = source.proposals.map((p:any) => proposalAdapter(p))
      return {
          proposals,
          pagination: source.pagination
      }
    }},
    gov_proposals_proposal_id: {
      url: '/cosmos/gov/v1/proposals/{proposal_id}',
      adapter: async (source: any): Promise<{proposal: GovProposal}> => {
          return {
              proposal: proposalAdapter(source.proposal)
          }
      },
    },
    gov_proposals_deposits: {
      url: '/cosmos/gov/v1/proposals/{proposal_id}/deposits',
      adapter,
    },
    gov_proposals_tally: {
      url: '/cosmos/gov/v1/proposals/{proposal_id}/tally',
      adapter,
    },
    gov_proposals_votes: {
      url: '/cosmos/gov/v1/proposals/{proposal_id}/votes',
      adapter,
    },
    gov_proposals_votes_voter: {
      url: '/cosmos/gov/v1/proposals/{proposal_id}/votes/{voter}',
      adapter,
    },
	
//bank
	bank_supply_by_denom: { url: '/cosmos/bank/v1beta1/supply/by_denom?denom={denom}', adapter },
//staking
  staking_deletations: {
    url: '/initia/mstaking/v1/delegations/{delegator_addr}',
    adapter,
  },
  staking_delegator_redelegations: {
    url: '/initia/mstaking/v1/delegators/{delegator_addr}/redelegations',
    adapter,
  },
  staking_delegator_unbonding_delegations: {
    url: '/initia/mstaking/v1/delegators/{delegator_addr}/unbonding_delegations',
    adapter,
  },
  staking_delegator_validators: {
    url: '/initia/mstaking/v1/delegators/{delegator_addr}/validators',
    adapter,
  },
 // staking_params: { url: '/initia/mstaking/v1/params', adapter },
  staking_pool: { url: '/initia/mstaking/v1/pool', adapter },
  staking_validators: {
    url: '/initia/mstaking/v1/validators?status={status}&pagination.limit={limit}',
    adapter,
  },
  staking_validators_address: {
    url: '/initia/mstaking/v1/validators/{validator_addr}',
    adapter,
  },
  staking_validators_delegations: {
    url: '/initia/mstaking/v1/validators/{validator_addr}/delegations',
    adapter,
  },
  staking_validators_delegations_delegator: {
    url: '/initia/mstaking/v1/validators/{validator_addr}/delegations/{delegator_addr}',
    adapter,
  },
  staking_validators_delegations_unbonding_delegations: {
    url: '/initia/mstaking/v1/validators/{validator_addr}/delegations/{delegator_addr}/unbonding_delegation',
    adapter,
  },
}