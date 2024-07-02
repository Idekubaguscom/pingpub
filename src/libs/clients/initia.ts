import type{ RequestRegistry } from '@/libs/registry'
import { adapter } from '@/libs/registry'
import type { Validator, StakingPool, StakingParam, GovProposal, PaginatedProposals, PaginatedValdiators } from '@/types'


// which registry is store
export const store = 'name' // name or version
// Blockchain Name
export const name = 'initia'

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
 

function stakingParamsAdapter(data: any): StakingParam {
  const params = data?.params;
  if (!params) {
    throw new Error('Staking parameters are undefined');
  }

  return {
    params: {
      unbonding_time: params.unbonding_time,
      max_validators: params.max_validators,
      max_entries: params.max_entries,
      historical_entries: params.historical_entries,
      bond_denom: params.bond_denoms[0],
      min_commission_rate: params.min_commission_rate,
      min_self_delegation: params.min_self_delegation,
    }
  };
}

function stakingPoolAdapter(data: any): StakingPool {
  const pool = data?.pool;
  if (!pool) {
    throw new Error('Staking pool data is undefined');
  }
  return {
    pool: {
      not_bonded_tokens: pool.not_bonded_tokens
        ?.filter((token: any) => token.denom === 'uinit')
        .map((token: any) => token.amount)
        .join(', ') || '',
      bonded_tokens: pool.bonded_tokens
        ?.filter((token: any) => token.denom === 'uinit')
        .map((token: any) => token.amount)
        .join(', ') || '',
    }
  };
}

function stakingValidatorsAdapter(data: any): Validator[] {
  const validators = data?.validators;
  if (!validators) {
    throw new Error('Staking validators data is undefined');
  }
  return validators.map((validator: any) => ({
    operator_address: validator.operator_address,
    consensus_pubkey: validator.consensus_pubkey,
    jailed: validator.jailed,
    status: validator.status,
    //tokens: validator.tokens.map((token: any) => token.amount).join(', ') || '',
    //delegator_shares: validator.delegator_shares.map((delegator_shares: any) => delegator_shares.amount).join(', ') || '',
    tokens: validator.voting_power,
    delegator_shares: validator.voting_power,
    description: {
      moniker: validator.description.moniker,
      identity: validator.description.identity,
      website: validator.description.website,
      security_contact: validator.description.security_contact,
      details: validator.description.details,
    },
    unbonding_height: validator.unbonding_height,
    unbonding_time: validator.unbonding_time,
    commission: validator.commission,
    min_self_delegation: validator.min_self_delegation,
    liquid_shares: validator.liquid_shares,
    validator_bond_shares: validator.validator_bond_shares,
    voting_power: validator.voting_power,
  })) || [];
}

function mintParamsAdapter(data: any): { params: any } {
  const params = data?.params;
  if (!params) {
    throw new Error('Mint parameters are undefined');
  }

  return {
    params: {
      mint_denom: params.reward_denom,
      inflation_rate_change: (parseFloat(params.dilution_rate) - parseFloat(params.release_rate)).toFixed(18),
      inflation_max: params.dilution_rate,
      inflation_min: params.release_rate,
      goal_bonded: "0.670000000000000000",
      blocks_per_year: params.dilution_period,
    }
  };
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

  staking_params: { 
    url: '/initia/mstaking/v1/params', 
    adapter: async (data: any): Promise<StakingParam> => stakingParamsAdapter(data)
  },
 
  staking_pool: { 
    url: '/initia/mstaking/v1/pool', 
    adapter: async (data: any): Promise<StakingPool> => stakingPoolAdapter(data) 
  },

  staking_validators: {
    url: '/initia/mstaking/v1/validators?status={status}&pagination.limit={limit}',
    adapter: async (data: any): Promise<PaginatedValdiators> => {
        const validators = stakingValidatorsAdapter(data);
        return {
            validators,
            pagination: data.pagination,
        };
    },
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
  //mint
  mint_annual_provisions: {
    url: '/initia/reward/v1/annual_provisions',
    adapter,
  },
  mint_params: { 
    url: '/initia/reward/v1/params', 
    adapter: async (data: any): Promise<{ params: any }> => mintParamsAdapter(data) 
  },
  mint_inflation: { 
    url: '/initia/reward/v1/params', 
    adapter: async (data: any): Promise<{ inflation: string }> => {
      const adaptedData = mintParamsAdapter(data);
      return { inflation: adaptedData.params.inflation_rate_change };
    }
  },
}